"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Sparkles, FolderOpen, ArrowRight, ArrowLeft, RefreshCw, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GoogleLogo = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
  </svg>
);

const getInitials = (name: string | null) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function ProfilePage() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Profile page Google login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/login");
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8B9] flex flex-col">
        <Navbar forceTheme="dark-bg" />
        <main className="flex-1 flex flex-col justify-center items-center min-h-[50vh] p-6 pt-24">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 text-[#233807] animate-spin" />
            <span className="text-xs font-bold text-[#233807]/70 font-sans">
              Loading Profile details...
            </span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8B9] flex flex-col">
        <Navbar forceTheme="dark-bg" />
        <main className="flex-1 flex flex-col justify-center items-center max-w-lg mx-auto w-full px-6 py-16 pt-28">
          <div className="w-full bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl p-8 shadow-xl flex flex-col items-center text-center">
            <div className="h-12 w-12 text-[#FFF8B9] bg-[#FFF8B9]/10 p-2.5 rounded-2xl border border-[#FFF8B9]/20 mb-4 flex items-center justify-center">
              <HelpCircle className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-extrabold text-[#FFF8B9] mb-2 font-sans">
              Authentication Required
            </h3>
            
            <p className="text-xs text-[#FFF8B9]/70 leading-relaxed mb-6 font-sans">
              Sign in to view your CodeRevise profile and manage your workspace settings.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-[#FFF8B9] hover:bg-white text-[#233807] font-extrabold text-sm rounded-xl py-3 px-4 shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin h-4 w-4 text-[#233807]" />
                  Connecting...
                </span>
              ) : (
                <>
                  <GoogleLogo />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Authenticated State
  return (
    <div className="min-h-screen bg-[#FFF8B9] flex flex-col">
      <Navbar forceTheme="dark-bg" />
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 pt-28 flex flex-col justify-center">
        <div className="w-full bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl shadow-xl overflow-hidden">
          
          {/* Card Title & Action Header */}
          <div className="px-8 py-5 border-b border-[#FFF8B9]/15 bg-[#FFF8B9]/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-4.5 w-4.5 text-[#FFF8B9]" />
              <h1 className="text-sm font-extrabold text-[#FFF8B9] uppercase tracking-wider font-sans">
                My Profile
              </h1>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
              title="Logout from CodeRevise"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            {/* User Avatar */}
            {user.photoURL && !imgError ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-24 h-24 rounded-full border-2 border-[#FFF8B9]/30 mb-4 shadow-md object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#FFF8B9]/15 text-[#FFF8B9] border-2 border-[#FFF8B9]/30 flex items-center justify-center font-bold text-2xl mb-4 shadow-md">
                {getInitials(user.displayName)}
              </div>
            )}

            {/* Display Name & Email */}
            <h2 className="text-2xl font-extrabold text-[#FFF8B9] mb-1 font-sans">
              {user.displayName || "Revision Student"}
            </h2>
            <p className="text-xs text-[#FFF8B9]/70 font-sans mb-4">
              {user.email}
            </p>

            {/* Connection badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-[#FFF8B9]/10 border border-[#FFF8B9]/20 text-[#FFF8B9]">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span>Connected with Google</span>
            </span>

            {/* Section Divider */}
            <div className="w-full h-px bg-[#FFF8B9]/15 my-6" />

            {/* Workspace section */}
            <div className="w-full text-left">
              <h3 className="text-[10px] font-extrabold text-[#FFF8B9]/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-sans">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Revision Workspace</span>
              </h3>

              <div className="bg-[#FFF8B9]/10 border border-[#FFF8B9]/20 rounded-2xl p-5 flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#FFF8B9]/60 block uppercase tracking-wide font-sans">
                    Chrome Extension Status
                  </span>
                  <span className="text-xs font-bold text-emerald-400 mt-1 block font-sans">
                    Extension Connected & Ready to Sync
                  </span>
                </div>

                <div className="flex justify-end border-t border-[#FFF8B9]/15 pt-3 mt-1">
                  <button
                    onClick={() => router.push("/revision/dashboard")}
                    className="flex items-center gap-2 text-xs font-extrabold text-[#233807] bg-[#FFF8B9] hover:bg-white transition-all cursor-pointer px-4 py-2.5 rounded-xl shadow-sm"
                  >
                    <span>Open Revision Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#FFF8B9]/70 hover:text-[#FFF8B9] mt-8 transition-colors cursor-pointer bg-transparent border-0 font-sans"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
