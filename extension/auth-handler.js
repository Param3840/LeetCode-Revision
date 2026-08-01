// CodeRevise Auth Handler Content Script - Phase 5B
// Runs on http://localhost:3000/* to capture successful login tokens from the web app

console.log("[CodeRevise] Auth Handler content script injected.");

window.addEventListener("message", (event) => {
  // Only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data && event.data.source === "coderevise-web") {
    if (event.data.type === "LOGIN_SUCCESS") {
      const { token, user } = event.data;
      console.log("[CodeRevise] Captured login token from web app:", user.email);

      const authData = {
        token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days matching backend expiry
        user
      };

      chrome.storage.local.set({ auth: authData }, () => {
        if (chrome.runtime.lastError) {
          console.error("[CodeRevise] Failed to save auth data:", chrome.runtime.lastError);
        } else {
          console.log("[CodeRevise] Auth data saved successfully.");
          // Send response back to the web page to acknowledge success
          window.postMessage({ source: "coderevise-extension", type: "SAVED_SUCCESS" }, "*");
        }
      });
    }
  }
});
