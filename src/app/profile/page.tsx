"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Sparkles, FolderOpen, ArrowRight, RefreshCw, HelpCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import RevisionHeatmap from "@/components/profile/RevisionHeatmap";
import AchievementsSection from "@/components/profile/AchievementsSection";
import styles from "./Profile.module.css";
import { API_URL } from "@/lib/api";

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
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
      }
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className={styles.container}>
        <Navbar forceTheme="dark-bg" />
        <main className={styles.workspace}>
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 text-[#233807] animate-spin" />
            <span className="text-xs font-bold text-[#233807]/70 font-sans">
              Loading Profile details...
            </span>
          </div>
        </main>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return (
      <div className={styles.container}>
        <Navbar forceTheme="dark-bg" />
        <main className={styles.workspace} style={{ maxWidth: "32rem" }}>
          <div className={styles.authCard}>
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
      </div>
    );
  }

  // 3. Authenticated State - 2-Column SaaS Layout
  return (
    <div className={styles.container}>
      <Navbar forceTheme="dark-bg" />
      <main className={styles.workspace}>
        <div className={styles.layoutGrid}>
          
          {/* LEFT COLUMN: Profile Sidebar */}
          <aside className={styles.profileSidebar}>
            {/* Header: My Profile + Logout */}
            <div className={styles.sidebarHeader}>
              <div className={styles.headerTitleGroup}>
                <Terminal className={styles.headerIcon} />
                <h1 className={styles.headerTitle}>My Profile</h1>
              </div>

              <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                title="Logout from CodeRevise"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>

            <div className={styles.sidebarBody}>
              {/* User Avatar */}
              {user.photoURL && !imgError ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className={styles.avatarImg}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {getInitials(user.displayName)}
                </div>
              )}

              {/* Display Name & Email */}
              <h2 className={styles.userName}>
                {user.displayName || "Revision Student"}
              </h2>
              <p className={styles.userEmail}>{user.email}</p>

              {/* Connection Badge */}
              <span className={styles.googleBadge}>
                <Sparkles className="h-3 w-3 text-yellow-400" />
                <span>Connected with Google</span>
              </span>

              <div className={styles.divider} />

              {/* Workspace Section */}
              <div className={styles.workspaceSection}>
                <h3 className={styles.workspaceTitle}>
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>Revision Workspace</span>
                </h3>

                <div className={styles.workspaceCard}>
                  <div>
                    <span className={styles.extensionLabel}>
                      Chrome Extension Status
                    </span>
                    <span className={styles.extensionStatus}>
                      Extension Connected & Ready to Sync
                    </span>
                  </div>

                  <button
                    onClick={() => router.push("/revision/dashboard")}
                    className={styles.btnDashboard}
                  >
                    <span>Open Revision Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Analytics Workspace */}
          <section className={styles.analyticsWorkspace}>
            {/* Primary Section: Revision Activity Heatmap */}
            <RevisionHeatmap />

            {/* Secondary Section: Achievements & Level System */}
            <AchievementsSection />
          </section>

        </div>
      </main>
    </div>
  );
}
