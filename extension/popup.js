// CodeRevise Extension Popup Script - Phase 2

const CODEREVISE_URL = "http://localhost:3000";

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

  // Fetch current LeetCode problem from extension local storage
  chrome.storage.local.get(["currentProblem"], (result) => {
    if (result && result.currentProblem) {
      const problem = result.currentProblem;

      if (problem.loading) {
        // Show loading state
        problemCard.classList.add("hidden");
        stateCard.classList.remove("hidden");
        stateText.textContent = "Detecting problem...";
      } else {
        // Show problem metadata card
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

        // Set Title
        titleEl.textContent = problem.title || "Unknown LeetCode Problem";

        // Set URL
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
      }
    } else {
      // Empty state (Not on LeetCode problem page)
      problemCard.classList.add("hidden");
      stateCard.classList.remove("hidden");
      stateText.textContent = "Open a LeetCode problem to get started.";
    }
  });

  // Navigation button handler
  openBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: CODEREVISE_URL });
  });
});
