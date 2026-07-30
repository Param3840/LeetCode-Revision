"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { ArrowRight, Sparkles, Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./Hero.module.css";

// Framer Motion Animation Variants
const labelVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
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

const ctaVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.15 }
  }
};

export default function Hero() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  return (
    <main id="hero" className={styles.heroMain}>
      <div className={styles.heroContent}>
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
              Solve problems on LeetCode. Accepted solutions automatically sync to your account.
              Revise them dynamically from your CodeRevise Dashboard.
            </p>
          </motion.div>

          {/* 4. Action Buttons */}
          <motion.div 
            variants={ctaVariants}
            className={styles.ctaContainer}
            style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}
          >
            {user ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <p className="text-xs font-bold text-[#FFF8B9] font-sans" style={{ opacity: 0.85 }}>
                  Welcome back, {user.displayName}! Connect the extension to start syncing solutions.
                </p>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <button 
                    onClick={() => router.push("/revision/dashboard")} 
                    className={styles.submitButton}
                    style={{ border: "0", cursor: "pointer" }}
                  >
                    <span>Open Revision Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    disabled
                    className={styles.submitButton}
                    style={{ 
                      backgroundColor: "rgba(255,255,255,0.1)", 
                      color: "rgba(255,255,255,0.4)", 
                      borderColor: "rgba(255,255,255,0.15)",
                      opacity: 0.6,
                      cursor: "not-allowed",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Extension (Coming Soon)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <button 
                  onClick={() => openLoginModal()} 
                  className={styles.submitButton}
                  style={{ border: "0", cursor: "pointer" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Get Started / Login</span>
                </button>
                <button 
                  disabled
                  className={styles.submitButton}
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.1)", 
                    color: "rgba(255,255,255,0.4)", 
                    borderColor: "rgba(255,255,255,0.15)",
                    opacity: 0.6,
                    cursor: "not-allowed",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Chrome Extension</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
