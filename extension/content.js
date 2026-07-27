// CodeRevise Content Script - Phase 1
// Detects LeetCode problem details and handles client-side SPA navigation

let lastUrl = window.location.href;

function updateProblemInfo() {
  const currentUrl = window.location.href;
  const currentTitle = document.title;

  const problemData = {
    url: currentUrl,
    title: currentTitle
  };

  chrome.storage.local.set({ currentProblem: problemData }, () => {
    console.log("CodeRevise: Stored problem details updated", problemData);
  });
}

// Initial execution
console.log("CodeRevise extension loaded on LeetCode");
updateProblemInfo();

// Safe periodic URL polling to track client-side React navigation transitions
setInterval(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // Allow slight delay for document title to update on page transitions
    setTimeout(() => {
      updateProblemInfo();
    }, 800);
  }
}, 1000);
