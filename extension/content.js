// CodeRevise Content Script - Phase 2
// Extracts structured LeetCode problem details and handles client-side SPA navigation

let lastUrl = window.location.href;
let extractionInterval = null;
let retryCount = 0;
const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 1000;

function getProblemSlug(urlStr) {
  try {
    const url = new URL(urlStr);
    const pathname = url.pathname;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === "problems" && parts[1]) {
      return parts[1];
    }
  } catch (e) {
    console.error("[CodeRevise] Error parsing slug from URL:", urlStr, e);
  }
  return null;
}

function extractTitleAndId() {
  let problemId = null;
  let title = null;

  // 1. Try to parse from document.title (usually "[ID]. [Title] - LeetCode")
  const docTitle = document.title;
  const titleMatch = docTitle.match(/^(\d+)\.\s+(.+?)(?:\s+-\s+LeetCode)?$/i);
  if (titleMatch) {
    problemId = titleMatch[1];
    title = titleMatch[2];
    return { problemId, title };
  }

  // 2. Fallback: Parse from heading tags or divs that display "[ID]. [Title]"
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, div, span');
  for (const el of headings) {
    const text = el.textContent ? el.textContent.trim() : "";
    const match = text.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      problemId = match[1];
      title = match[2];
      break;
    }
  }

  // 3. Fallback for title only if no ID found
  if (!title) {
    const docTitleFallback = docTitle.match(/^(.+?)(?:\s+-\s+LeetCode)?$/i);
    if (docTitleFallback) {
      title = docTitleFallback[1];
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
    if (text && !topics.includes(text)) {
      topics.push(text);
    }
  });
  return topics;
}

function startMetadataExtraction() {
  if (extractionInterval) {
    clearInterval(extractionInterval);
  }
  
  const slug = getProblemSlug(window.location.href);
  if (!slug) return;
  
  console.log(`[CodeRevise] Started metadata extraction for slug: ${slug}`);
  
  // Set initial loading state in local storage
  const initialData = {
    slug: slug,
    url: `https://leetcode.com/problems/${slug}/`,
    title: "Detecting problem...",
    difficulty: null,
    topics: [],
    loading: true
  };
  chrome.storage.local.set({ currentProblem: initialData });

  retryCount = 0;
  extractionInterval = setInterval(() => {
    retryCount++;
    console.log(`[CodeRevise] Attempting metadata extraction (Try ${retryCount}/${MAX_RETRIES})...`);
    
    const { problemId, title } = extractTitleAndId();
    const difficulty = extractDifficulty();
    const topics = extractTopics();
    
    // Check if we have gathered all required metadata (ID, Title, Difficulty)
    if (problemId && title && difficulty) {
      clearInterval(extractionInterval);
      extractionInterval = null;
      
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
        console.log("[CodeRevise] Stored problem metadata successfully:", problemData);
      });
    } else if (retryCount >= MAX_RETRIES) {
      clearInterval(extractionInterval);
      extractionInterval = null;
      
      // Save whatever partial metadata we have gathered
      const problemData = {
        problemId: problemId || null,
        title: title || slug,
        slug: slug,
        url: `https://leetcode.com/problems/${slug}/`,
        difficulty: difficulty || null,
        topics: topics || [],
        loading: false,
        detectedAt: Date.now()
      };
      
      chrome.storage.local.set({ currentProblem: problemData }, () => {
        console.warn("[CodeRevise] Max retries reached. Stored partial metadata:", problemData);
      });
    }
  }, RETRY_INTERVAL_MS);
}

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
    lastUrl = window.location.href;
    console.log("[CodeRevise] URL change detected:", lastUrl);
    
    const slug = getProblemSlug(lastUrl);
    if (slug) {
      startMetadataExtraction();
    } else {
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
