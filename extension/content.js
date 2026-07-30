// CodeRevise Content Script - Phase 3 (Bug Fixes & Tracing Logs)
// Extracts structured LeetCode problem details and handles client-side SPA navigation safely
// Monitors LeetCode coding area to detect accepted code submissions in real-time

let lastUrl = window.location.href;
let extractionInterval = null;
let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 1000;

// Token-based generation mechanism to prevent asynchronous race conditions
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

function runExtractionLoop(slug, generation) {
  if (extractionInterval) {
    clearInterval(extractionInterval);
    extractionInterval = null;
  }
  
  retryCount = 0;
  let graphqlAttempted = false;
  
  const extractAndStore = async () => {
    if (generation !== currentGeneration) {
      console.log(`[CodeRevise] Aborting extraction for slug '${slug}': Stale generation`);
      return true; // Stop loop
    }
    
    // 1. Try DOM Scraping first
    const { problemId, title } = extractTitleAndId();
    const difficulty = extractDifficulty();
    const topics = extractTopics();
    
    if (problemId && title && difficulty) {
      if (generation !== currentGeneration || getProblemSlug(window.location.href) !== slug) {
        console.log(`[CodeRevise] Aborting storage write for slug '${slug}': Stale generation/slug`);
        return true;
      }
      
      const problemData = {
        problemId: problemId,
        title: title,
        slug: slug,
        url: `https://leetcode.com/problems/${slug}/`,
        difficulty: difficulty,
        topics: topics,
        loading: false,
        detectedAt: Date.now()
      };
      
      chrome.storage.local.set({ currentProblem: problemData }, () => {
        console.log(`[CodeRevise] DOM metadata:`, { problemId, title, difficulty });
        console.log(`[CodeRevise] currentProblem updated: ${title}`);
      });
      return true;
    }
    
    // 2. Try GraphQL as a fallback (exactly once per generation)
    if (!graphqlAttempted) {
      graphqlAttempted = true;
      
      fetchMetadataFromGraphQL(slug).then(gqlData => {
        if (generation !== currentGeneration || getProblemSlug(window.location.href) !== slug) {
          console.log(`[CodeRevise] Ignoring stale result: ${slug} (generation: ${generation}, current: ${currentGeneration})`);
          return;
        }
        
        if (gqlData && gqlData.problemId && gqlData.title && gqlData.difficulty) {
          const problemData = {
            problemId: gqlData.problemId,
            title: gqlData.title,
            slug: slug,
            url: `https://leetcode.com/problems/${slug}/`,
            difficulty: gqlData.difficulty,
            topics: gqlData.topics,
            loading: false,
            detectedAt: Date.now()
          };
          
          chrome.storage.local.set({ currentProblem: problemData }, () => {
            console.log(`[CodeRevise] currentProblem updated: ${gqlData.title}`);
          });
          
          if (extractionInterval) {
            clearInterval(extractionInterval);
            extractionInterval = null;
          }
        }
      });
    }
    
    return false;
  };

  extractAndStore().then(success => {
    if (success) return;
    
    extractionInterval = setInterval(async () => {
      retryCount++;
      console.log(`[CodeRevise] Attempting metadata extraction (Try ${retryCount}/${MAX_RETRIES})...`);
      
      if (generation !== currentGeneration) {
        clearInterval(extractionInterval);
        extractionInterval = null;
        return;
      }
      
      const success = await extractAndStore();
      if (success || retryCount >= MAX_RETRIES) {
        clearInterval(extractionInterval);
        extractionInterval = null;
        
        if (!success && generation === currentGeneration) {
          const { problemId, title } = extractTitleAndId();
          const difficulty = extractDifficulty();
          const topics = extractTopics();
          
          if (generation === currentGeneration && getProblemSlug(window.location.href) === slug) {
            const problemData = {
              slug,
              url: `https://leetcode.com/problems/${slug}/`,
              title: title || "Problem detected",
              problemId: problemId || null,
              difficulty: difficulty || null,
              topics: topics || [],
              loading: false,
              partial: true,
              detectedAt: Date.now()
            };
            
            chrome.storage.local.set({ currentProblem: problemData }, () => {
              console.warn("[CodeRevise] Max retries reached. Stored partial metadata:", problemData);
            });
          }
        }
      }
    }, RETRY_INTERVAL_MS);
  });
}

function startMetadataExtraction() {
  const slug = getProblemSlug(window.location.href);
  if (!slug) return;

  currentGeneration++;
  const thisGeneration = currentGeneration;

  // Invalidate pending submissions ONLY if navigating to a DIFFERENT slug
  if (slug !== currentSlug) {
    console.log(`[CodeRevise][Phase3] Navigation: ${currentSlug || "none"} -> ${slug}. Invalidating pending submission.`);
    currentSlug = slug;
    cancelPendingSubmission();
  } else {
    console.log(`[CodeRevise][Phase3] Same slug transition: ${slug}. Keeping pending submission observer active.`);
  }

  chrome.storage.local.get(["currentProblem"], (result) => {
    const existing = result ? result.currentProblem : null;
    
    // If the stored problem matches the current slug and is fully populated, preserve it!
    if (isCompleteProblemMetadata(existing, slug)) {
      console.log(`[CodeRevise] Metadata for slug '${slug}' is already complete. Preserving.`);
      return;
    }
    
    console.log(`[CodeRevise] Active slug: ${slug}`);
    console.log(`[CodeRevise] Clearing stale current problem`);
    console.log(`[CodeRevise] Extraction started: ${slug} generation: ${thisGeneration}`);
    
    // Set loading state under this slug immediately to invalidate stale data
    const initialData = {
      slug: slug,
      url: `https://leetcode.com/problems/${slug}/`,
      title: "Detecting problem...",
      problemId: null,
      difficulty: null,
      topics: [],
      loading: true
    };
    chrome.storage.local.set({ currentProblem: initialData });

    runExtractionLoop(slug, thisGeneration);
  });
}

// ==========================================
// Phase 3: Accepted Submission Detection
// ==========================================

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
    console.log("[CodeRevise][Phase3] Creating latestAcceptedSubmission object.");
    
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
        }
      };

      console.log("[CodeRevise][Phase3] Saving into chrome.storage.local");
      console.log("[CodeRevise][Phase3] Before storage.");

      chrome.storage.local.set({ latestAcceptedSubmission: acceptedSubmission }, () => {
        console.log("[CodeRevise][Phase3] After storage.");
        if (chrome.runtime.lastError) {
          console.error("[CodeRevise][Phase3] Storage failed with error:", chrome.runtime.lastError);
        } else {
          console.log("[CodeRevise][Phase3] Storage completed successfully.");
          console.log("[CodeRevise][Phase3] Popup should now update.");
          
          // Immediately read back to verify
          chrome.storage.local.get(["latestAcceptedSubmission"], (readResult) => {
            console.log("[CodeRevise][Phase3] Verified stored object from storage:", readResult.latestAcceptedSubmission);
          });
        }
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

// Safe periodic URL polling to track client-side React navigation transitions
setInterval(() => {
  if (window.location.href !== lastUrl) {
    const oldUrl = lastUrl;
    lastUrl = window.location.href;
    console.log("[CodeRevise] URL change detected:", lastUrl);
    
    const slug = getProblemSlug(lastUrl);
    const oldSlug = getProblemSlug(oldUrl);
    
    if (slug) {
      startMetadataExtraction();
    } else {
      currentGeneration++; // Cancel any active extraction runs
      currentSlug = null; // Clear active slug
      cancelPendingSubmission();
      if (extractionInterval) {
        clearInterval(extractionInterval);
        extractionInterval = null;
      }
      chrome.storage.local.remove("currentProblem", () => {
        console.log("[CodeRevise] Navigated away from LeetCode problem. Cleared currentProblem.");
      });
    }
  }
}, 1000);
