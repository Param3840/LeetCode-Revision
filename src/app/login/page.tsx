"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check if token parameters are present in URL
    const token = searchParams.get("token");
    const id = searchParams.get("id");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const picture = searchParams.get("picture");

    if (token && id && name && email) {
      console.log("[CodeRevise] Captured token parameters in login callback URL.");
      
      const user = { id, name, email, picture };

      // Dispatch to the extension's content script
      window.postMessage(
        {
          source: "coderevise-web",
          type: "LOGIN_SUCCESS",
          token,
          user,
        },
        "*"
      );

      // Save to localStorage for website itself
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Show success
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
    
    // Check if error URL query is returned
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Listen for acknowledgment from the extension
    const handleSavedAck = (event: MessageEvent) => {
      if (event.data && event.data.source === "coderevise-extension") {
        if (event.data.type === "SAVED_SUCCESS") {
          console.log("[CodeRevise] Extension acknowledged credentials storage.");
          setSuccess(true);
        }
      }
    };
    window.addEventListener("message", handleSavedAck);
    return () => window.removeEventListener("message", handleSavedAck);
  }, []);

  const handleGoogleClick = () => {
    setError(null);
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  const handleContinueClick = () => {
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-md bg-white border border-card-border rounded-2xl shadow-lg p-8 glow-border">
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
          Code<span className="text-[#568203]">Revise</span>
        </h1>
        <p className="text-sm text-foreground/70 mt-2 font-sans">
          Sign in to connect your browser extension
        </p>
      </div>

      {success ? (
        <div className="text-center py-6 font-sans">
          <span className="text-4xl">🎉</span>
          <h2 className="text-xl font-bold text-foreground mt-4">Connected Successfully!</h2>
          <p className="text-sm text-foreground/70 mt-2">
            The CodeRevise extension is now linked. You can close this tab.
          </p>
        </div>
      ) : (
        <div className="space-y-6 font-sans">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleClick}
            className="w-full py-3 bg-[#233807] hover:bg-[#34540a] text-[#fdfdfd] font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.096 0 4.005.771 5.49 2.039l3.07-3.07C18.252 1.957 15.352 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.746-.08-1.305-.224-1.995H12.24z"/>
            </svg>
            Continue with Google
          </button>

          <div className="text-center pt-2 border-t border-card-border">
            <p className="text-xs text-foreground/50 mb-2">Already connected?</p>
            <button
              onClick={handleContinueClick}
              className="text-[#233807] hover:text-[#34540a] font-bold text-sm underline cursor-pointer"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={
        <div className="text-center font-sans text-foreground/70">
          Loading authentication page...
        </div>
      }>
        <LoginContent />
      </Suspense>
    </main>
  );
}
