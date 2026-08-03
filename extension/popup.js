// CodeRevise Extension Popup Script - Phase 5B (Account Connection)

const CODEREVISE_URL = "http://localhost:3000";
const LOGIN_URL = "http://localhost:3000/login";
const BACKEND_URL = "http://localhost:5000";

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
  const submissionLanguageEl = document.getElementById("submission-language");
  const submissionCodeEl = document.getElementById("submission-code");
  const submissionTimeEl = document.getElementById("submission-time");
  const submissionSyncEl = document.getElementById("submission-sync");
  
  const openBtn = document.getElementById("open-btn");
  
  // Auth UI Elements
  const authDisconnected = document.getElementById("auth-disconnected");
  const authConnected = document.getElementById("auth-connected");
  const authNameEl = document.getElementById("auth-name");
  const authEmailEl = document.getElementById("auth-email");
  const authAvatarEl = document.getElementById("auth-avatar");
  const connectBtn = document.getElementById("connect-btn");
  const logoutBtn = document.getElementById("logout-btn");

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

    // Set Title
    titleEl.textContent = problem.title || "Problem detected";

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
  };

  const renderPopup = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const activeTabUrl = activeTab ? activeTab.url : "";
      const activeTabSlug = getProblemSlug(activeTabUrl);

      if (activeTabSlug) {
        chrome.storage.local.get(["currentProblem"], (result) => {
          const problem = result ? result.currentProblem : null;
          
          if (problem && problem.slug === activeTabSlug) {
            if (problem.loading) {
              showLoading("Detecting current problem...");
            } else {
              showProblemCard(problem);
            }
          } else {
            showLoading("Detecting current problem...");
          }
        });
      } else {
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
        
        const sol = sub.solution || {};
        submissionLanguageEl.textContent = `Language: ${sol.language || "Unknown"}`;
        submissionCodeEl.textContent = `Code: ${sol.code ? "Available" : "Not Available"}`;
        
        submissionTimeEl.textContent = formatSubmissionTime(sub.acceptedAt);

        // Render Sync Status
        const syncStatus = sub.syncStatus || "Not Synced";
        submissionSyncEl.textContent = syncStatus;
        
        submissionSyncEl.className = "sync-badge";
        if (syncStatus.includes("Successfully")) {
          submissionSyncEl.classList.add("synced");
        } else if (syncStatus.includes("Uploading")) {
          submissionSyncEl.classList.add("pending");
        } else {
          submissionSyncEl.classList.add("failed");
        }
      } else {
        submissionCard.classList.add("hidden");
        noSubmissionCard.classList.remove("hidden");
      }
    });
  };

  const checkAuth = async () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(["auth"], async (result) => {
        const auth = result ? result.auth : null;
        if (!auth || !auth.token) {
          resolve(null);
          return;
        }

        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${auth.token}`
            }
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.data) {
              const updatedAuth = {
                ...auth,
                user: {
                  id: data.data._id || data.data.id,
                  name: data.data.name,
                  email: data.data.email,
                  picture: data.data.picture
                }
              };
              chrome.storage.local.set({ auth: updatedAuth });
              resolve(updatedAuth);
            } else {
              chrome.storage.local.remove(["auth"]);
              resolve(null);
            }
          } else if (res.status === 401) {
            console.warn("[CodeRevise] Token expired or invalid.");
            chrome.storage.local.remove(["auth"]);
            resolve(null);
          } else {
            console.error("[CodeRevise] Backend server returned error status:", res.status);
            resolve({ ...auth, offline: true });
          }
        } catch (err) {
          console.error("[CodeRevise] Network error connecting to backend:", err);
          resolve({ ...auth, offline: true });
        }
      });
    });
  };

  const renderAuth = (auth) => {
    if (auth && auth.user) {
      authDisconnected.classList.add("hidden");
      authConnected.classList.remove("hidden");
      
      let displayName = auth.user.name || "User";
      if (auth.offline) {
        displayName += " (Offline)";
      }
      authNameEl.textContent = displayName;
      authEmailEl.textContent = auth.user.email || "";

      // Render Avatar image if present
      if (auth.user.picture) {
        authAvatarEl.src = auth.user.picture;
        authAvatarEl.classList.remove("hidden");
      } else {
        authAvatarEl.classList.add("hidden");
      }
    } else {
      authConnected.classList.add("hidden");
      authDisconnected.classList.remove("hidden");
      authAvatarEl.classList.add("hidden");
    }
  };

  const initAuth = async () => {
    // Show disconnected by default while checking
    authDisconnected.classList.remove("hidden");
    authConnected.classList.add("hidden");
    
    const auth = await checkAuth();
    renderAuth(auth);
  };

  // Run initial renders
  initAuth();
  renderPopup();
  renderLatestSubmission();

  // Handle dynamic changes to local storage while popup is open
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes.currentProblem) {
        renderPopup();
      }
      if (changes.latestAcceptedSubmission) {
        renderLatestSubmission();
      }
      if (changes.auth) {
        renderAuth(changes.auth.newValue);
      }
    }
  });

  // Connect Account button handler
  connectBtn.addEventListener("click", () => {
    chrome.storage.local.remove(["extensionDisconnectedByUser"], () => {
      chrome.tabs.create({ url: LOGIN_URL });
    });
  });

  // Logout button handler
  logoutBtn.addEventListener("click", () => {
    chrome.storage.local.set({ extensionDisconnectedByUser: true }, () => {
      chrome.storage.local.remove(["auth"], () => {
        renderAuth(null);
        console.log("[CodeRevise] Extension session destroyed and flagged as explicitly disconnected.");
      });
    });
  });

  // Navigation button handler
  openBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: CODEREVISE_URL });
  });
});
