// CodeRevise Content Script - Phase 4 (Bug Fixes & Solution Capture)
// Extracts structured LeetCode problem details and handles client-side SPA navigation safely
// Monitors LeetCode coding area to detect accepted code submissions in real-time

let lastUrl = window.location.href;
let extractionInterval = null;
let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 1000;

let currentGeneration = 0;
let currentSlug = null;

// Submission observation state
let submissionPending = false;
let resultObserver = null;

const TERMINAL_STATUSES = [
  "Accepted",
  "Wrong Answer",
  "Time Limit Exceeded",
  "Memory Limit Exceeded",
  "Runtime Error",
  "Compile Error",
  "Output Limit Exceeded"
];

const LANGUAGE_MAP = {
  "cpp": "C++",
  "java": "Java",
  "python": "Python3",
  "python3": "Python3",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "golang": "Go",
  "go": "Go",
  "rust": "Rust",
  "csharp": "C#",
  "ruby": "Ruby",
  "swift": "Swift",
  "kotlin": "Kotlin",
  "scala": "Scala",
  "php": "PHP"
};

const KNOWN_LANGUAGES = [
  "C++", "Java", "Python", "Python3", "C", "C#", "JavaScript", "TypeScript",
  "Go", "Rust", "Ruby", "Swift", "Kotlin", "Scala", "PHP", "HTML", "R", "Dart"
];

function getProblemSlug(urlStr) {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === "problems" && parts[1]) {
      return parts[1];
    }
  } catch (e) {
    // Ignore invalid urls
  }
  return null;
}

function isCompleteProblemMetadata(problem, expectedSlug) {
  if (!problem) return false;
  if (problem.slug !== expectedSlug) return false;
  if (!problem.problemId || typeof problem.problemId !== "string" || problem.problemId.trim() === "") return false;
  if (!problem.title || typeof problem.title !== "string" || problem.title.trim() === "" || problem.title === "Detecting problem...") return false;
  if (problem.title.endsWith("- LeetCode")) return false;
  if (!["Easy", "Medium", "Hard"].includes(problem.difficulty)) return false;
  if (problem.url !== `https://leetcode.com/problems/${expectedSlug}/`) return false;
  if (problem.loading !== false) return false;
  if (!Array.isArray(problem.topics)) return false;
  return true;
}

function extractTitleAndId() {
  let problemId = null;
  let title = null;

  const normalizeTitle = (t) => {
    if (!t) return "";
    return t.replace(/\s+-\s+LeetCode$/i, "")
            .replace(/\s+-\s+Description$/i, "")
            .replace(/\s+-\s+Submissions$/i, "")
            .replace(/\s+-\s+Solutions$/i, "")
            .trim();
  };

  // 1. Try to find the title in the DOM via H1 or tags with title classes
  const selectors = [
    'h1', 
    'div[class*="text-title-large"]', 
    'div[class*="question-title"]',
    'span[class*="question-title"]',
    'a[class*="question-title"]'
  ];
  
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const text = el.textContent.trim();
      const match = text.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        problemId = match[1];
        title = normalizeTitle(match[2]);
        console.log(`[CodeRevise] DOM Specific Match (Selector: ${selector}): id=${problemId}, title=${title}`);
        return { problemId, title };
      }
    }
  }

  // 2. Scan other headings for pattern match
  const headings = document.querySelectorAll('h1, h2, h3, h4');
  for (const el of headings) {
    const text = el.textContent ? el.textContent.trim() : "";
    const match = text.match(/^(\d+)\.\s*(.+)$/);
    if (match) {
      problemId = match[1];
      title = normalizeTitle(match[2]);
      console.log(`[CodeRevise] DOM Specific Heading Match: id=${problemId}, title=${title}`);
      return { problemId, title };
    }
  }

  // 3. Fallback to document.title
  const docTitle = document.title;
  if (docTitle) {
    const titleMatch = docTitle.match(/^(\d+)\.\s+(.+)$/);
    if (titleMatch) {
      problemId = titleMatch[1];
      title = normalizeTitle(titleMatch[2]);
      console.log(`[CodeRevise] DOM Fallback (docTitle match): id=${problemId}, title=${title}`);
    } else {
      title = normalizeTitle(docTitle);
      console.log(`[CodeRevise] DOM Fallback (docTitle only): title=${title}`);
    }
  }

  return { problemId, title };
}

function extractDifficulty() {
  // Try stable class selectors first
  const diffEl = document.querySelector('[class*="text-difficulty-"], [class*="difficulty-"]');
  if (diffEl && diffEl.textContent) {
    const text = diffEl.textContent.trim();
    if (["Easy", "Medium", "Hard"].includes(text)) {
      return text;
    }
  }

  // Fallback: search for elements with exact text
  const spansAndDivs = document.querySelectorAll('span, div');
  for (const el of spansAndDivs) {
    const text = el.textContent ? el.textContent.trim() : "";
    if (text === "Easy" || text === "Medium" || text === "Hard") {
      return text;
    }
  }
  return null;
}

function extractTopics() {
  const topics = [];
  const tagLinks = document.querySelectorAll('a[href*="/tag/"]');
  tagLinks.forEach(link => {
    const text = link.textContent ? link.textContent.trim() : "";
    if (text && !topics.includes(text) && text.toLowerCase() !== "discuss" && text.toLowerCase() !== "solution") {
      topics.push(text);
    }
  });
  return topics;
}

async function fetchMetadataFromGraphQL(slug) {
  try {
    console.log(`[CodeRevise] GraphQL request started: ${slug}`);
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query questionTitle($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              title
              difficulty
              topicTags {
                name
              }
            }
          }
        `,
        variables: {
          titleSlug: slug
        }
      })
    });
    
    console.log(`[CodeRevise] GraphQL HTTP status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`[CodeRevise] GraphQL failed: HTTP status ${response.status}`);
      return null;
    }
    
    const json = await response.json();
    if (json && json.data && json.data.question) {
      const q = json.data.question;
      const result = {
        problemId: q.questionId,
        title: q.title,
        difficulty: q.difficulty,
        topics: q.topicTags ? q.topicTags.map(t => t.name) : []
      };
      console.log(`[CodeRevise] GraphQL metadata received:`, result);
      return result;
    } else {
      console.warn(`[CodeRevise] GraphQL failed: missing data.question inside response`, json);
    }
  } catch (e) {
    console.error(`[CodeRevise] GraphQL failed:`, e);
  }
  return null;
}

function startMetadataExtraction(targetSlug) {
  const currentUrlSlug = getProblemSlug(window.location.href);
  const slug = targetSlug || currentUrlSlug;
  if (!slug) return;

  currentGeneration++;
  const thisGeneration = currentGeneration;

  if (slug !== currentSlug) {
    currentSlug = slug;
    cancelPendingSubmission();
  }

  console.log("[CodeRevise] Extraction started");

  if (extractionInterval) {
    clearInterval(extractionInterval);
    extractionInterval = null;
  }

  const runExtraction = async () => {
    // 1. Query LeetCode GraphQL immediately using the slug
    console.log("[CodeRevise] Fetching GraphQL metadata");
    const gqlData = await fetchMetadataFromGraphQL(slug);

    const activeSlugNow = getProblemSlug(window.location.href);
    if (thisGeneration !== currentGeneration || activeSlugNow !== slug || !window.location.pathname.includes(slug)) {
      console.log("[CodeRevise] Ignored stale extraction");
      return;
    }

    if (gqlData && gqlData.problemId && gqlData.title && gqlData.difficulty) {
      console.log("[CodeRevise] GraphQL metadata received");

      const problemData = {
        problemId: String(gqlData.problemId),
        title: gqlData.title,
        slug: slug,
        url: `https://leetcode.com/problems/${slug}/`,
        difficulty: gqlData.difficulty,
        topics: gqlData.topics || [],
        loading: false,
        detectedAt: Date.now()
      };

      if (thisGeneration === currentGeneration && getProblemSlug(window.location.href) === slug) {
        console.log("[CodeRevise] Extraction completed");
        console.log("[CodeRevise] Updating currentProblem from GraphQL");
        chrome.storage.local.set({ currentProblem: problemData }, () => {
          console.log("[CodeRevise] Current problem updated");
        });
        return; // STOP! GraphQL succeeded. NEVER execute DOM fallback or DOM overwrite!
      } else {
        console.log("[CodeRevise] Ignored stale extraction");
        return;
      }
    }

    // 2. DOM Fallback ONLY if GraphQL failed!
    console.log("[CodeRevise] GraphQL failed");
    console.log("[CodeRevise] Using DOM fallback");

    let retries = 0;
    extractionInterval = setInterval(() => {
      retries++;
      const currentActiveSlug = getProblemSlug(window.location.href);

      if (thisGeneration !== currentGeneration || currentActiveSlug !== slug || !window.location.pathname.includes(slug)) {
        console.log("[CodeRevise] Ignored stale extraction");
        clearInterval(extractionInterval);
        extractionInterval = null;
        return;
      }

      const { problemId, title } = extractTitleAndId();
      const difficulty = extractDifficulty();
      const topics = extractTopics();

      const cleanTitleSlug = title ? title.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
      const cleanTargetSlug = slug.replace(/[^a-z0-9]/g, "");
      const isTitleMatchingSlug = cleanTitleSlug.includes(cleanTargetSlug) || cleanTargetSlug.includes(cleanTargetSlug);

      if (problemId && title && difficulty && isTitleMatchingSlug) {
        clearInterval(extractionInterval);
        extractionInterval = null;

        if (thisGeneration === currentGeneration && getProblemSlug(window.location.href) === slug) {
          const problemData = {
            problemId: String(problemId),
            title: title,
            slug: slug,
            url: `https://leetcode.com/problems/${slug}/`,
            difficulty: difficulty,
            topics: topics || [],
            loading: false,
            detectedAt: Date.now()
          };

          console.log("[CodeRevise] Extraction completed");
          chrome.storage.local.set({ currentProblem: problemData }, () => {
            console.log("[CodeRevise] Current problem updated");
          });
        } else {
          console.log("[CodeRevise] Ignored stale extraction");
        }
      } else if (retries >= MAX_RETRIES) {
        clearInterval(extractionInterval);
        extractionInterval = null;
        console.log("[CodeRevise] Ignored stale extraction");
      }
    }, 500);
  };

  runExtraction();
}

// ==========================================
// Phase 3 & 4: Accepted Submission Detection
// ==========================================

function normalizeLanguageName(name) {
  if (!name) return "Unknown";
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (LANGUAGE_MAP[lower]) {
    return LANGUAGE_MAP[lower];
  }
  return trimmed;
}

function getSelectedLanguageFromDOM() {
  const buttons = document.querySelectorAll('button, div[class*="select"]');
  for (const btn of buttons) {
    if (btn.textContent) {
      const text = btn.textContent.trim();
      if (KNOWN_LANGUAGES.includes(text)) {
        return text;
      }
    }
  }
  return null;
}

function extractSolutionFromPage() {
  return new Promise((resolve) => {
    const handleResponse = (e) => {
      window.removeEventListener("CodeRevise_SolutionResponse", handleResponse);
      resolve(e.detail);
    };
    window.addEventListener("CodeRevise_SolutionResponse", handleResponse);
    
    console.log("[CodeRevise][Phase4] Dispatched CodeRevise_SolutionRequest to main world.");
    window.dispatchEvent(new CustomEvent("CodeRevise_SolutionRequest"));
    
    // Safety timeout if main world does not reply in 1 second
    setTimeout(() => {
      window.removeEventListener("CodeRevise_SolutionResponse", handleResponse);
      resolve(null);
    }, 1000);
  });
}

function isTerminalStatus(status) {
  if (!status) return false;
  return TERMINAL_STATUSES.some(term => status.toLowerCase().includes(term.toLowerCase()));
}

function findSubmissionStatus() {
  // 1. Search for data-e2e-locator first
  const e2eEl = document.querySelector('[data-e2e-locator="submission-result"]');
  if (e2eEl && e2eEl.textContent) {
    return e2eEl.textContent.trim();
  }

  // 2. Search for common LeetCode result status classes/attributes
  const statusSelectors = [
    'span[data-cy="question-submission-result"]',
    'div[class*="submission-result"]',
    'div[class*="result-title"]',
    'span[class*="result-title"]',
    'div[class*="status-"]',
    'span[class*="status-"]'
  ];

  for (const selector of statusSelectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }

  // 3. Fallback: check elements containing text content "Accepted"
  const successEl = document.querySelector('.text-success, .text-sd-green, [class*="text-difficulty-easy"], [class*="success"]');
  if (successEl && successEl.textContent) {
    const text = successEl.textContent.trim();
    if (text.includes("Accepted")) return "Accepted";
  }

  return null;
}

function handleSubmissionResult(statusText) {
  submissionPending = false;
  
  if (resultObserver) {
    resultObserver.disconnect();
    resultObserver = null;
  }

  const cleanStatus = statusText.includes("Accepted") ? "Accepted" : statusText;
  console.log(`[CodeRevise][Phase3] Expected: Accepted, Actual: ${cleanStatus}`);

  if (cleanStatus === "Accepted") {
    console.log("[CodeRevise][Phase3] Accepted condition matched.");
    console.log("[CodeRevise][Phase4] Capture started.");
    
    // Attempt Solution Capture (Language & Source Code)
    console.log("[CodeRevise][Phase4] Attempting Monaco extraction.");
    extractSolutionFromPage().then(solutionData => {
      let detectedLanguage = null;
      let detectedCode = null;
      
      if (solutionData) {
        if (solutionData.code) {
          detectedCode = solutionData.code;
          console.log("[CodeRevise][Phase4] Monaco extraction succeeded.");
        } else {
          console.log("[CodeRevise][Phase4] Monaco extraction failed.");
        }
        if (solutionData.language) {
          console.log(`Raw Monaco language ID: ${solutionData.language}`);
          detectedLanguage = normalizeLanguageName(solutionData.language);
          console.log(`Mapped language: ${detectedLanguage}`);
        }
      } else {
        console.log("[CodeRevise][Phase4] Monaco extraction failed (No response from main world).");
      }

      // Fallback 1: React Fiber (executed in main world context, if it failed there, we print log and move to DOM fallbacks)
      if (!detectedCode) {
        console.log("[CodeRevise][Phase4] Attempting React Fiber fallback.");
      }

      // Fallback 2: Hidden textarea
      if (!detectedCode) {
        console.log("[CodeRevise][Phase4] Attempting textarea fallback.");
        const textarea = document.querySelector('.monaco-editor textarea.inputarea');
        if (textarea && textarea.value && textarea.value.trim().length > 0) {
          detectedCode = textarea.value;
          console.log("[CodeRevise][Phase4] Textarea fallback succeeded.");
        } else {
          console.log("[CodeRevise][Phase4] Textarea fallback failed.");
        }
      }

      // Fallback 3: Rendered DOM lines
      if (!detectedCode) {
        console.log("[CodeRevise][Phase4] Attempting DOM fallback.");
        const lineEls = document.querySelectorAll('.monaco-editor .view-line');
        if (lineEls && lineEls.length > 0) {
          const lines = [];
          lineEls.forEach(el => {
            lines.push(el.textContent || "");
          });
          detectedCode = lines.join("\n");
          console.log("[CodeRevise][Phase4] DOM fallback succeeded.");
        } else {
          console.log("[CodeRevise][Phase4] DOM fallback failed.");
        }
      }

      // Check if code was successfully captured
      if (!detectedCode) {
        console.error("[CodeRevise][Phase4] Solution capture failed: No source code could be extracted from any fallback tier.");
        return;
      }

      // Language final lookup from DOM selector if Monaco query yielded empty results
      if (!detectedLanguage) {
        detectedLanguage = getSelectedLanguageFromDOM();
        if (detectedLanguage) {
          console.log(`Mapped language (from DOM selector): ${detectedLanguage}`);
        }
      }

      if (!detectedLanguage) {
        console.warn("[CodeRevise][Phase4] Language detection failed. Defaulting to 'Unknown'.");
        detectedLanguage = "Unknown";
      }

      const charCount = detectedCode.length;
      const lineCount = detectedCode.split("\n").length;

      console.log(`[CodeRevise][Phase4]\nLanguage detected:\n${detectedLanguage}\n--------------------------------\nSource code length:\n${charCount} characters\n--------------------------------\nLines:\n${lineCount}\n--------------------------------\nCode successfully extracted.\n--------------------------------`);

      // Retrieve the current problem metadata from local storage
      chrome.storage.local.get(["currentProblem"], (result) => {
        const currentProblem = result ? result.currentProblem : null;
        const slug = getProblemSlug(window.location.href);
        
        const problemInfo = currentProblem && currentProblem.slug === slug ? currentProblem : {
          slug: slug,
          url: `https://leetcode.com/problems/${slug}/`,
          loading: false
        };

        const { problemId, title } = extractTitleAndId();
        const difficulty = extractDifficulty();
        const topics = extractTopics();

        const acceptedSubmission = {
          id: Date.now(),
          status: "Accepted",
          acceptedAt: new Date().toISOString(),
          problem: {
            problemId: problemInfo.problemId || problemId || null,
            title: (problemInfo.title && problemInfo.title !== "Detecting problem...") ? problemInfo.title : (title || slug),
            slug: slug,
            difficulty: problemInfo.difficulty || difficulty || null,
            topics: (problemInfo.topics && problemInfo.topics.length > 0) ? problemInfo.topics : (topics || []),
            canonicalUrl: `https://leetcode.com/problems/${slug}/`
          },
          solution: {
            language: detectedLanguage,
            code: detectedCode
          }
        };

        console.log("[CodeRevise][Phase3] Saving into chrome.storage.local");
        console.log("[CodeRevise][Phase3] Before storage.");
        console.log("[CodeRevise][Phase4] Submission object updated.");

        chrome.storage.local.set({ latestAcceptedSubmission: acceptedSubmission }, () => {
          console.log("[CodeRevise][Phase3] After storage.");
          if (chrome.runtime.lastError) {
            console.error("[CodeRevise][Phase3] Storage failed with error:", chrome.runtime.lastError);
          } else {
            console.log("[CodeRevise][Phase3] Storage completed successfully.");
            console.log("[CodeRevise][Phase4] Storage completed.");
            console.log("[CodeRevise][Phase3] Popup should now update.");
            
            // Invoke automatic submission sync immediately after storage completion
            syncSubmissionToBackend(acceptedSubmission);
          }
        });
      });
    });
  } else {
    console.log(`[CodeRevise][Phase3] Duplicate/Failure protection: result is "${cleanStatus}". Ignoring.`);
  }
}

function setupSubmissionObserver() {
  if (resultObserver) {
    resultObserver.disconnect();
    resultObserver = null;
  }

  resultObserver = new MutationObserver((mutations) => {
    if (!submissionPending) return;

    console.log(`[CodeRevise][Phase3] Mutation received. Changes count: ${mutations.length}`);

    const status = findSubmissionStatus();
    if (status) {
      const cleanStatus = status.trim();
      console.log(`[CodeRevise][Phase3] Current status text: "${cleanStatus}"`);
      
      if (isTerminalStatus(cleanStatus)) {
        handleSubmissionResult(cleanStatus);
      }
    }
  });

  resultObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log("[CodeRevise][Phase3] MutationObserver started.");
}

function handleSubmissionStart() {
  if (submissionPending) {
    console.log("[CodeRevise][Phase3] Submission already pending. Ignoring.");
    return;
  }

  const slug = getProblemSlug(window.location.href);
  if (!slug) {
    console.warn("[CodeRevise][Phase3] Submit clicked but no problem slug detected.");
    return;
  }

  console.log("[CodeRevise][Phase3] Submit button detected.");
  submissionPending = true;
  console.log("[CodeRevise][Phase3] Submission session created.");

  setupSubmissionObserver();
}

function cancelPendingSubmission() {
  if (submissionPending) {
    submissionPending = false;
    console.log("[CodeRevise][Phase3] SPA transition detected. Cancelling pending submission observer.");
  }
  if (resultObserver) {
    resultObserver.disconnect();
    resultObserver = null;
  }
}

function initializeSubmissionTracker() {
  console.log("[CodeRevise][Phase3] Initialization started");

  // Register click listener to detect user clicking the Submit button
  document.addEventListener("click", (e) => {
    if (!e.target || typeof e.target.closest !== "function") return;
    
    const btn = e.target.closest('button[data-e2e-locator="console-submit-button"], button[data-cy="submit-code-btn"], button.submit-btn');
    const isSubmitBtn = btn || (e.target.tagName === "BUTTON" && e.target.textContent.trim() === "Submit");
    
    if (isSubmitBtn) {
      handleSubmissionStart();
    }
  });
  console.log("[CodeRevise][Phase3] Registered submit click listener.");

  // Register keydown listener for Monaco code editor submission shortcut (Ctrl/Cmd + Enter)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.closest('.monaco-editor') || activeEl.closest('[class*="editor"]'))) {
        handleSubmissionStart();
      }
    }
  });
  console.log("[CodeRevise][Phase3] Registered keyboard shortcut listener.");
}

// Call initialization immediately on content script load
initializeSubmissionTracker();

// ==========================================
// Initialization & Polling
// ==========================================

// Initial execution
const initialSlug = getProblemSlug(window.location.href);
if (initialSlug) {
  startMetadataExtraction();
} else {
  chrome.storage.local.remove("currentProblem");
}

function checkUrlChange() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    const oldUrl = lastUrl;
    lastUrl = currentUrl;
    
    console.log("[CodeRevise] Navigation detected");
    
    const newSlug = getProblemSlug(currentUrl);
    
    if (newSlug) {
      startMetadataExtraction(newSlug);
    } else {
      currentGeneration++; // Cancel any active extraction runs
      currentSlug = null; // Clear active slug
      cancelPendingSubmission();
      if (extractionInterval) {
        clearInterval(extractionInterval);
        extractionInterval = null;
      }
      chrome.storage.local.remove("currentProblem");
    }
  }
}

// SPA Navigation Event Listeners (non-inline for CSP compliance)
window.addEventListener("popstate", () => checkUrlChange());
window.addEventListener("hashchange", () => checkUrlChange());

// Fast 200ms polling fallback for zero-latency detection
setInterval(() => {
  checkUrlChange();
}, 200);

// Observe document title changes (fires when React/Next updates problem title in SPA)
try {
  const titleObserver = new MutationObserver(() => {
    checkUrlChange();
  });
  if (document.querySelector("title")) {
    titleObserver.observe(document.querySelector("title"), { childList: true, subtree: true, characterData: true });
  }
} catch (e) {
  // Ignore observer setup errors
}

// ==========================================
// Phase 6: Automatic Submission Syncing
// ==========================================

function syncSubmissionToBackend(sub, isRetry = false) {
  chrome.storage.local.get(["auth"], async (res) => {
    const auth = res ? res.auth : null;
    if (!auth || !auth.token) {
      console.log("[CodeRevise][Sync] JWT Missing");
      sub.syncStatus = "Please connect your account.";
      chrome.storage.local.set({ latestAcceptedSubmission: sub });
      return;
    }

    console.log("[CodeRevise][Sync] JWT Found");
    console.log("[CodeRevise][Sync] Upload started");

    sub.syncStatus = "Uploading...";
    chrome.storage.local.set({ latestAcceptedSubmission: sub });

    const payload = {
      problemNumber: sub.problem.problemId,
      title: sub.problem.title,
      slug: sub.problem.slug,
      url: sub.problem.canonicalUrl,
      difficulty: sub.problem.difficulty,
      tags: sub.problem.topics,
      language: sub.solution.language,
      solution: sub.solution.code,
      submittedAt: sub.acceptedAt
    };

    try {
      const response = await fetch("http://localhost:5000/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log("[CodeRevise][Sync] Upload successful");
        sub.syncStatus = "Synced Successfully";
        chrome.storage.local.set({ latestAcceptedSubmission: sub });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log("[CodeRevise][Sync] Upload failed");
        
        if (response.status === 401) {
          console.warn("[CodeRevise][Sync] Expired JWT - Auto logout");
          chrome.storage.local.remove(["auth"]);
          sub.syncStatus = "Upload Failed";
          chrome.storage.local.set({ latestAcceptedSubmission: sub });
        } else if (response.status === 400) {
          console.error("[CodeRevise][Sync] Validation error: ", errorData.message || "Bad Request");
          sub.syncStatus = "Upload Failed";
          chrome.storage.local.set({ latestAcceptedSubmission: sub });
        } else {
          console.error(`[CodeRevise][Sync] Upload failed with status ${response.status}`);
          handleUploadFailure(sub, isRetry);
        }
      }
    } catch (err) {
      console.log("[CodeRevise][Sync] Upload failed");
      console.error("[CodeRevise][Sync] Network failure: ", err);
      handleUploadFailure(sub, isRetry);
    }
  });
}

function handleUploadFailure(sub, isRetry) {
  if (!isRetry) {
    console.log("[CodeRevise][Sync] Network Failure. Retrying once...");
    setTimeout(() => {
      syncSubmissionToBackend(sub, true);
    }, 1500);
  } else {
    console.log("[CodeRevise][Sync] Upload failed");
    sub.syncStatus = "Upload Failed";
    chrome.storage.local.set({ latestAcceptedSubmission: sub });
  }
}

