"use client";

import React from "react";
import { FolderOpen, SlidersHorizontal, BookOpen, Code, CheckCircle, Sparkles } from "lucide-react";
import styles from "./About.module.css";

export default function About() {
  return (
    <section id="about" className={styles.aboutSection}>
      <div className={styles.aboutContainer}>
        {/* Header */}
        <div className={styles.aboutHeader}>
          <span className={styles.aboutLabel}>What We Give </span>
          <h2 className={styles.aboutTitle}>
            Elegantly Organize Your LeetCode Solutions
          </h2>
          <p className={styles.aboutSubtitle}>
            Preparing for technical interviews can be chaotic. CodeRevise connects directly to your public GitHub LeetCode repository on-demand to create a structured revision library categorized by difficulty, topic, and programming language.
          </p>
        </div>

        {/* Features Grid */}
        <div className={styles.featuresGrid}>
          {/* Card 1 */}
          <div className={styles.featureCard}>
            <div className={styles.cardIconWrapper}>
              <FolderOpen className="h-5 w-5" />
            </div>
            <h3 className={styles.cardTitle}>GitHub Repository Scanner</h3>
            <p className={styles.cardText}>
              Just paste your public GitHub repository URL containing your LeetCode solution folders. Our analyzer automatically scans files and loads your solutions live.
            </p>
          </div>

          {/* Card 2 */}
          <div className={styles.featureCard}>
            <div className={styles.cardIconWrapper}>
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <h3 className={styles.cardTitle}>Dynamic Topic Sorting</h3>
            <p className={styles.cardText}>
              No more digging through folders! Your solved problems are automatically grouped by difficulty levels and categorized with official topic tags.
            </p>
          </div>

          {/* Card 3 */}
          <div className={styles.featureCard}>
            <div className={styles.cardIconWrapper}>
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className={styles.cardTitle}>Quick Revision Sheets</h3>
            <p className={styles.cardText}>
              For every problem, view key observations, time/space complexity details, example inputs/outputs, and standard approaches to refresh your memory instantly.
            </p>
          </div>

          {/* Card 4 */}
          <div className={styles.featureCard}>
            <div className={styles.cardIconWrapper}>
              <Code className="h-5 w-5" />
            </div>
            <h3 className={styles.cardTitle}>Interactive Code Viewer</h3>
            <p className={styles.cardText}>
              Read your actual solved code files directly on the page. Supports toggling between multiple files if you solved a problem in different languages (e.g., C++, Python).
            </p>
          </div>

          {/* Card 5 */}
          <div className={styles.featureCard}>
            <div className={styles.cardIconWrapper}>
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className={styles.cardTitle}>Interactive Revision Checklist</h3>
            <p className={styles.cardText}>
              Mark questions as "Revised" or "Not Revised" as you review them. Track your progress with a visual slider dashboard that displays your overall preparation percentage.
            </p>
          </div>

          {/* Card 6 */}
          <div className={styles.featureCard}>
            <div className={styles.cardIconWrapper}>
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className={styles.cardTitle}>No Accounts, Instant Access</h3>
            <p className={styles.cardText}>
              No signups, user accounts, or server databases. All of your revision checkmarks and cached repository configurations are saved locally inside your own browser.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
