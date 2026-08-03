"use client";

import React, { useEffect, useState } from "react";
import { X, AlertCircle, Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle, loginModalContextText } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    setIsConnecting(true);
    setErrorMsg(null);
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white border border-[#e1daab] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#233807]/40 hover:text-[#233807] transition-colors p-1.5 rounded-lg hover:bg-[#FFF8B9]/30 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo Icon */}
        <div className="h-12 w-12 text-[#568203] bg-[#FFF8B9]/50 p-2.5 rounded-xl border border-[#e1daab]/50 mb-4 flex items-center justify-center">
          <Terminal className="h-6 w-6" />
        </div>

        {/* Header Title */}
        <h3 className="text-2xl font-extrabold text-[#233807] tracking-tight mb-2 font-sans">
          Welcome to CodeRevise
        </h3>
        
        {/* Description */}
        <p className="text-xs text-[#233807]/60 leading-relaxed max-w-sm mb-6 font-sans">
          {loginModalContextText || "Sign in to save your revision experience and manage your CodeRevise profile."}
        </p>

        {/* Error Banner */}
        {errorMsg && (
          <div className="w-full bg-red-50 text-red-700 text-xs font-semibold rounded-lg p-3 border border-red-200/50 mb-4 text-left flex items-start gap-2 animate-in slide-in-from-top-1 duration-150">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isConnecting}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#e1daab] hover:border-[#568203]/40 text-[#233807] font-bold text-sm rounded-xl py-3 px-4 shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#233807]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Connecting...
            </span>
          ) : (
            <>
              <GoogleLogo />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Footer Subtext */}
        <span className="text-[10px] text-[#233807]/45 mt-4 leading-normal">
          Continue securely with Google.
        </span>
      </div>
    </div>
  );
}
