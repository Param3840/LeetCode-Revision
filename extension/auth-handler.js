// CodeRevise Auth Handler Content Script
// Transfers initial web authentication to Chrome Extension without overriding user-initiated extension logouts

console.log("[CodeRevise] Auth Handler content script injected.");

function syncWebSessionToExtension() {
  try {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // Only transfer active sessions; do NOT clear chrome.storage.local on web logout
    if (token && storedUser) {
      const user = JSON.parse(storedUser);
      const authData = {
        token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        user
      };

      chrome.storage.local.get(["auth", "extensionDisconnectedByUser"], (result) => {
        // If user explicitly logged out from extension, do NOT auto-reconnect
        if (result && result.extensionDisconnectedByUser) {
          console.log("[CodeRevise] Auto-sync skipped: Extension was explicitly disconnected by user.");
          return;
        }

        const currentAuth = result ? result.auth : null;
        if (!currentAuth || currentAuth.token !== token || currentAuth.user?.email !== user.email) {
          chrome.storage.local.set({ auth: authData }, () => {
            console.log("[CodeRevise] Synchronized active session to Chrome Extension:", user.email);
          });
        }
      });
    }
  } catch (e) {
    console.error("[CodeRevise] Error syncing web session to extension:", e);
  }
}

// 1. Synchronize immediately on page load
syncWebSessionToExtension();

// 2. Observe changes to localStorage across window storage events
window.addEventListener("storage", () => {
  syncWebSessionToExtension();
});
