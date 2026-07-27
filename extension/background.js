// CodeRevise Background Service Worker - Phase 1
// Handles extension lifecycle events

chrome.runtime.onInstalled.addListener(() => {
  console.log("CodeRevise extension installed");
});
