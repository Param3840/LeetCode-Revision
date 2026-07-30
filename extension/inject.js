// CodeRevise Main World Injection Script - Phase 4 Debugging
// Runs directly in the page context to bypass CSP and access window.monaco APIs

(function() {
  console.log("[CodeRevise][Phase4] Main world injection script loaded.");

  window.addEventListener("CodeRevise_SolutionRequest", () => {
    console.log("[CodeRevise][Phase4] Main world received CodeRevise_SolutionRequest.");
    try {
      let code = null;
      let language = null;

      // 1. Attempt Monaco Editor Model extraction
      if (window.monaco && typeof window.monaco.editor === "object") {
        console.log("[CodeRevise][Phase4] Attempting Monaco extraction in main world.");
        const models = window.monaco.editor.getModels();
        if (models && models.length > 0) {
          for (const model of models) {
            const val = model.getValue();
            if (val && val.trim().length > 0) {
              code = val;
              language = model.getLanguageId ? model.getLanguageId() : (model.getModeId ? model.getModeId() : null);
              console.log("[CodeRevise][Phase4] Monaco extraction inside main world succeeded.");
              break;
            }
          }
        }
      }

      // 2. React Fiber Fallback
      if (!code) {
        console.log("[CodeRevise][Phase4] Attempting React Fiber fallback in main world.");
        const editorEl = document.querySelector('.monaco-editor');
        if (editorEl) {
          const reactKey = Object.keys(editorEl).find(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'));
          if (reactKey) {
            const fiber = editorEl[reactKey];
            let current = fiber;
            while (current) {
              if (current.memoizedProps && typeof current.memoizedProps.value === 'string') {
                code = current.memoizedProps.value;
                if (current.memoizedProps.language) {
                  language = current.memoizedProps.language;
                }
                console.log("[CodeRevise][Phase4] React Fiber extraction inside main world succeeded.");
                break;
              }
              current = current.return;
            }
          }
        }
      }

      window.dispatchEvent(new CustomEvent("CodeRevise_SolutionResponse", {
        detail: { code, language }
      }));
    } catch (err) {
      console.error("[CodeRevise][Phase4] Error in main world extraction script:", err);
      window.dispatchEvent(new CustomEvent("CodeRevise_SolutionResponse", {
        detail: { code: null, language: null }
      }));
    }
  });
})();
