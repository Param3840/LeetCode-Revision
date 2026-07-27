"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ArrowRight, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { analyzeRepository, GitHubError } from "@/lib/github";
import { saveCurrentRepoUrl, saveRepoCache } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import styles from "./Hero.module.css";

type LoadingPhase = 
  | "idle"
  | "reading"
  | "finding"
  | "matching"
  | "preparing";

// Framer Motion Animation Variants
const labelVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const artworkVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 80, damping: 18 }
  }
};

const ctaVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.15 }
  }
};

const textGroupVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.05 }
  }
};

export default function Hero() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async (url: string) => {
    setError(null);
    setLoadingPhase("reading");

    try {
      // Phase 1: Reading configuration
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoadingPhase("finding");

      // Phase 2: Finding solution files
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoadingPhase("matching");

      // Phase 3: Matching metadata
      const problems = await analyzeRepository(url);
      setLoadingPhase("preparing");

      // Phase 4: Preparing revision library
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Save cache and redirect
      saveCurrentRepoUrl(url);
      saveRepoCache(problems.owner, problems.repo, problems);

      router.push("/revision/dashboard");
    } catch (err) {
      setLoadingPhase("idle");
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while analyzing the repository.");
      }
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    if (!user) {
      openLoginModal("Sign in with Google to start your revision workspace.", () => {
        startAnalysis(repoUrl.trim());
      });
      return;
    }

    await startAnalysis(repoUrl.trim());
  };

  const loadTestRepo = async () => {
    const demoUrl = "https://github.com/Param3840/LeetCode";
    setRepoUrl(demoUrl);
    
    if (!user) {
      openLoginModal("Sign in with Google to start your revision workspace.", () => {
        startAnalysis(demoUrl);
      });
      return;
    }

    await startAnalysis(demoUrl);
  };

  return (
    <main id="hero" className={styles.heroMain}>
      <div className={styles.heroContent}>
        <AnimatePresence mode="wait">
          {loadingPhase === "idle" ? (
            <motion.div
              key="landing-hero"
              initial="hidden"
              animate="show"
              exit="hidden"
              className="w-full flex flex-col items-center"
            >
              {/* 1. Label */}
              <motion.span 
                variants={labelVariants}
                className={styles.heroLabel}
              >
                Interview Revision Platform
              </motion.span>

              {/* 2. Overlapping LEETCODE Typographic Artwork */}
              <div className={styles.titleContainer}>
                <svg 
                  viewBox="0 0 900 200" 
                  width="100%" 
                  height="100%"
                  className={styles.leetcodeSvg}
                >
                  <defs>
                    <mask id="logo-cutout-mask">
                      <rect width="900" height="200" fill="white" />
                      <circle cx="450" cy="90" r="54" fill="black" />
                    </mask>
                  </defs>

                  <text 
                    x="50%" 
                    y="135" 
                    textAnchor="middle" 
                    className={styles.leetcodeTextNode}
                    mask="url(#logo-cutout-mask)"
                  >
                    LEETCODE
                  </text>
                </svg>

                <div className={styles.logoOverlay}>
                  <img 
                    src="/LeetCode_logo_black.png" 
                    alt="LeetCode Logo" 
                    className={styles.logoImage}
                    style={{ transform: "translate(-50%, -50%)" }}
                  />
                </div>
              </div>

              {/* 3. Text Descriptions */}
              <motion.div 
                variants={textGroupVariants}
                className={styles.subtitleContainer}
              >
                <h1 className={styles.subtitleQuote}>
                  “Practice makes permanent. Structured revision makes ready.”
                </h1>
                <p className={styles.subtitleText}>
                  Convert solved solutions in your public GitHub repository into an interactive, 
                  beautifully structured revision library categorized by difficulty, topic, and language.
                </p>
              </motion.div>

              {/* 4. Repository Form Selector */}
              <motion.div 
                variants={ctaVariants}
                className={styles.ctaContainer}
              >
                <form onSubmit={handleAnalyze} className={styles.inputFormGroup}>
                  <input
                    type="url"
                    placeholder="Enter your public LeetCode GitHub repo URL..."
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    required
                    className={styles.inputField}
                  />
                  <button type="submit" className={styles.submitButton}>
                    <span>Analyze Repo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </form>

                <div className={styles.testRepoContainer}>
                  <span className={styles.testRepoLabel}>Don't have a repo?</span>
                  <button 
                    type="button" 
                    onClick={loadTestRepo} 
                    className={styles.testRepoLink}
                  >
                    Load Param3840/LeetCode Demo
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className={styles.errorCard}>
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className={styles.errorTitle}>Analysis Failed</h4>
                      <p className={styles.errorText}>{error}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col items-center justify-center"
            >
              {/* Spinner card */}
              <div className={styles.loaderContainer}>
                <div className={styles.spinnerWrapper}>
                  <div className={styles.spinnerCircle} />
                  <img src="/LeetCode_logo_black.png" alt="Analyzing" className={styles.spinnerImage} />
                </div>
                
                <h3 className={styles.loaderTitle}>Analyzing Repository</h3>
                <p className={styles.loaderPhase}>
                  {loadingPhase === "reading" && "Reading configuration..."}
                  {loadingPhase === "finding" && "Finding solution files..."}
                  {loadingPhase === "matching" && "Matching LeetCode metadata..."}
                  {loadingPhase === "preparing" && "Preparing revision library..."}
                </p>

                {/* Checklist steps */}
                <div className={styles.loaderStepList}>
                  <div className={styles.loaderStepRow}>
                    {loadingPhase !== "reading" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                    )}
                    <span className={loadingPhase === "reading" ? styles.stepRowActive : styles.stepRowPending}>
                      Reading configuration files
                    </span>
                  </div>

                  <div className={styles.loaderStepRow}>
                    {loadingPhase !== "reading" && loadingPhase !== "finding" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    ) : loadingPhase === "finding" ? (
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <div className={styles.emptyCircle} />
                    )}
                    <span className={loadingPhase === "finding" ? styles.stepRowActive : styles.stepRowPending}>
                      Scanning repository directories
                    </span>
                  </div>

                  <div className={styles.loaderStepRow}>
                    {loadingPhase === "preparing" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    ) : loadingPhase === "matching" ? (
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <div className={styles.emptyCircle} />
                    )}
                    <span className={loadingPhase === "matching" ? styles.stepRowActive : styles.stepRowPending}>
                      Matching solutions to problems
                    </span>
                  </div>

                  <div className={styles.loaderStepRow}>
                    {loadingPhase === "preparing" ? (
                      <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <div className={styles.emptyCircle} />
                    )}
                    <span className={loadingPhase === "preparing" ? styles.stepRowActive : styles.stepRowPending}>
                      Preparing revision library
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
