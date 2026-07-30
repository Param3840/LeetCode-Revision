// CodeRevise Extension Popup Script - Phase 2 (Bug Fixes)

const CODEREVISE_URL = "http://localhost:3000";

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

document.addEventListener("DOMContentLoaded", () => {
  const problemCard = document.getElementById("problem-card");
  const stateCard = document.getElementById("state-card");
  const stateText = document.getElementById("state-text");
  
  const problemIdEl = document.getElementById("problem-id");
  const difficultyEl = document.getElementById("problem-difficulty");
  const titleEl = document.getElementById("problem-title");
  const topicsContainer = document.getElementById("topics-container");
  const urlEl = document.getElementById("problem-url");
  
  const openBtn = document.getElementById("open-btn");

  const showLoading = (msg) => {
    problemCard.classList.add("hidden");
    stateCard.classList.remove("hidden");
    stateText.textContent = msg || "Detecting current problem...";
  };

  const showEmptyState = (msg) => {
    problemCard.classList.add("hidden");
    stateCard.classList.remove("hidden");
    stateText.textContent = msg || "Open a LeetCode problem to get started.";
  };

  const showProblemCard = (problem) => {
    stateCard.classList.add("hidden");
    problemCard.classList.remove("hidden");

    // Set ID
    problemIdEl.textContent = problem.problemId ? `#${problem.problemId}` : "";
    
    // Set Difficulty
    if (problem.difficulty) {
      difficultyEl.textContent = problem.difficulty;
      difficultyEl.className = "difficulty-badge " + problem.difficulty.toLowerCase();
      difficultyEl.classList.remove("hidden");
    } else {
      difficultyEl.classList.add("hidden");
    }

    // Set Title (never fallback to slug directly unless formatted)
    titleEl.textContent = problem.title || "Problem detected";

    // Set URL (canonical)
    let displayUrl = problem.url || "";
    if (displayUrl.startsWith("https://")) {
      displayUrl = displayUrl.substring(8);
    }
    urlEl.textContent = displayUrl;

    // Set Topic chips
    topicsContainer.innerHTML = "";
    if (problem.topics && problem.topics.length > 0) {
      problem.topics.forEach(topic => {
        const chip = document.createElement("span");
        chip.className = "topic-chip";
        chip.textContent = topic;
        topicsContainer.appendChild(chip);
      });
    }
  };

  const renderPopup = () => {
    // 1. Query the active tab URL to make sure it matches the problem we show
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const activeTabUrl = activeTab ? activeTab.url : "";
      const activeTabSlug = getProblemSlug(activeTabUrl);

      if (activeTabSlug) {
        // We are on a supported LeetCode problems page!
        chrome.storage.local.get(["currentProblem"], (result) => {
          const problem = result ? result.currentProblem : null;
          
          if (problem && problem.slug === activeTabSlug) {
            if (problem.loading) {
              showLoading("Detecting current problem...");
            } else {
              showProblemCard(problem);
            }
          } else {
            // Slug mismatch or loading state hasn't written yet. Show loader.
            showLoading("Detecting current problem...");
          }
        });
      } else {
        // Not on a LeetCode problem page
        showEmptyState("Open a LeetCode problem to get started.");
      }
    });
  };

  // Run initial render
  renderPopup();

  // Handle dynamic changes to local storage while popup is open
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.currentProblem) {
      renderPopup();
    }
  });

  // Navigation button handler
  openBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: CODEREVISE_URL });
  });
});
