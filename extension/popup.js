// CodeRevise Extension Popup Script - Phase 1

const CODEREVISE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("problem-title");
  const urlEl = document.getElementById("problem-url");
  const openBtn = document.getElementById("open-btn");

  // Fetch current LeetCode problem from extension storage
  chrome.storage.local.get(["currentProblem"], (result) => {
    if (result && result.currentProblem) {
      const problem = result.currentProblem;
      titleEl.textContent = problem.title || "Unknown LeetCode Problem";
      
      // Clean up/shorten the URL display text for aesthetics if it's long
      let displayUrl = problem.url || "";
      if (displayUrl.startsWith("https://")) {
        displayUrl = displayUrl.substring(8);
      }
      urlEl.textContent = displayUrl;
    } else {
      titleEl.textContent = "No LeetCode problem found";
      urlEl.textContent = "Open a LeetCode problem to get started.";
    }
  });

  // Navigation button handler
  openBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: CODEREVISE_URL });
  });
});
