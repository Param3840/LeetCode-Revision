"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, RefreshCw, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loaderContent}>
          <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
          <span>Loading revision workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        
        {/* Header Section */}
        <header className={styles.headerSection} style={{ marginBottom: "1.5rem" }}>
          <div>
            <div className={styles.headerMeta}>
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Revision dashboard</span>
            </div>
            <h1 className={styles.headerTitle} style={{ marginTop: "0.25rem" }}>
              Interview Revision
            </h1>
            <p className={styles.headerSubtitle} style={{ marginTop: "0.25rem", color: "rgba(35, 56, 7, 0.6)" }}>
              Welcome back, {user.displayName || "Student"}
            </p>
          </div>
        </header>

        {/* Empty State Layout */}
        <div 
          className="flex flex-col items-center justify-center text-center p-12 bg-white border border-[#e1daab] rounded-2xl shadow-xl mt-6"
          style={{ padding: "4rem 2rem" }}
        >
          <div 
            className="h-12 w-12 text-[#568203] bg-[#FFF8B9]/50 p-2.5 rounded-xl border border-[#e1daab]/50 mb-4 flex items-center justify-center mx-auto"
          >
            <FolderOpen className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#233807] mb-2 font-sans tracking-wide">
            YOUR REVISION LIBRARY
          </h2>
          <p className="text-xs text-[#233807]/60 leading-relaxed max-w-sm mb-6 font-sans">
            No synced problems yet. Install/connect the CodeRevise extension and solve a problem on LeetCode. Accepted solutions will appear here automatically.
          </p>
          <button
            disabled
            className="flex items-center justify-center gap-2 bg-[#233807] text-[#FFF8B9] font-bold text-xs rounded-xl py-3 px-6 shadow opacity-50 cursor-not-allowed border-0"
            style={{ border: "none" }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Extension Coming / Connect Extension</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className={styles.loaderWrapper}>
            <div className={styles.loaderContent}>
              <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
              <span>Loading workspace settings...</span>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
      <Footer />
    </>
  );
}
