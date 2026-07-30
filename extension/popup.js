// CodeRevise Extension Popup Script - Phase 3 (Bug Fixes & Submission Rendering)

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

function formatSubmissionTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 12 instead of 0
  
  return `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;
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
  
  const submissionCard = document.getElementById("submission-card");
  const noSubmissionCard = document.getElementById("no-submission-card");
  const submissionMetaEl = document.getElementById("submission-meta");
  const submissionTimeEl = document.getElementById("submission-time");
  
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

  const renderLatestSubmission = () => {
    chrome.storage.local.get(["latestAcceptedSubmission"], (result) => {
      if (result && result.latestAcceptedSubmission) {
        const sub = result.latestAcceptedSubmission;
        
        noSubmissionCard.classList.add("hidden");
        submissionCard.classList.remove("hidden");
        
        const prob = sub.problem || {};
        submissionMetaEl.textContent = `Problem: #${prob.problemId || ""} ${prob.title || ""}`;
        submissionTimeEl.textContent = formatSubmissionTime(sub.acceptedAt);
      } else {
        submissionCard.classList.add("hidden");
        noSubmissionCard.classList.remove("hidden");
      }
    });
  };

  // Run initial renders
  renderPopup();
  renderLatestSubmission();

  // Handle dynamic changes to local storage while popup is open
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.currentProblem) {
        renderPopup();
      }
      if (changes.latestAcceptedSubmission) {
        console.log("[CodeRevise][Phase3] Popup received storage update for latestAcceptedSubmission:", changes.latestAcceptedSubmission.newValue);
        renderLatestSubmission();
        console.log("[CodeRevise] Popup updated.");
      }
    }
  });

  // Navigation button handler
  openBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: CODEREVISE_URL });
  });
});
