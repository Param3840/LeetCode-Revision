"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for acknowledgment from the extension
    const handleSavedAck = (event: MessageEvent) => {
      if (event.data && event.data.source === "coderevise-extension") {
        if (event.data.type === "SAVED_SUCCESS") {
          console.log("[CodeRevise] Extension acknowledged credentials storage.");
          setSuccess(true);
          // Redirect to dashboard
          setTimeout(() => {
            router.push("/revision/dashboard");
          }, 2000);
        }
      }
    };
    window.addEventListener("message", handleSavedAck);
    return () => window.removeEventListener("message", handleSavedAck);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data) {
        const { token, user } = data.data;

        // Dispatches the login event to the extension's content script
        window.postMessage(
          {
            source: "coderevise-web",
            type: "LOGIN_SUCCESS",
            token,
            user,
          },
          "*"
        );

        // Fallback: If no extension content script is running, still save to local storage for the website itself
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        // Wait for saved ack from extension. If none in 1.5 seconds, redirect directly
        setTimeout(() => {
          if (!success) {
            router.push("/revision/dashboard");
          }
        }, 1500);
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      setError("Cannot reach auth server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
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
          <div className="text-center py-6">
            <span className="text-4xl">🎉</span>
            <h2 className="text-xl font-bold text-foreground mt-4">Connected Successfully!</h2>
            <p className="text-sm text-foreground/70 mt-2">
              The CodeRevise extension is now linked. You can close this tab.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 font-sans">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-background/30 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#568203]/20 focus:border-[#568203] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-2.5 bg-background/30 border border-card-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#568203]/20 focus:border-[#568203] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#568203] hover:bg-[#436602] text-white font-bold rounded-xl transition-colors glow-button shadow-md flex items-center justify-center disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Connect Account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
