"use client";

import React from "react";
import styles from "./Steps.module.css";

export default function Steps() {
  return (
    <section id="steps" className={styles.stepsSection}>
      <div className={styles.stepsContainer}>
        {/* Header */}
        <div className={styles.stepsHeader}>
          <span className={styles.stepsLabel}>Setup Guide</span>
          <h2 className={styles.stepsTitle}>
            How to Connect Your Solutions
          </h2>
          <p className={styles.stepsSubtitle}>
            Getting started with CodeRevise is simple. Follow these 4 simple steps to link LeetCode and CodeRevise together.
          </p>
        </div>

        {/* Steps Grid */}
        <div className={styles.grid}>
          {/* Step 1 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>1</div>
            <h3 className={styles.cardTitle}>Login to CodeRevise</h3>
            <p className={styles.cardText}>
              Create an account by logging in with Google. This creates your private, cloud-synchronized revision dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>2</div>
            <h3 className={styles.cardTitle}>Install Extension</h3>
            <p className={styles.cardText}>
              Install the CodeRevise Chrome Extension. The extension runs securely in the background on LeetCode pages.
            </p>
          </div>

          {/* Step 3 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>3</div>
            <h3 className={styles.cardTitle}>Solve on LeetCode</h3>
            <p className={styles.cardText}>
              Head over to LeetCode and solve any coding problem. Submitting a correct, accepted solution triggers dynamic synchronization.
            </p>
          </div>

          {/* Step 4 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>4</div>
            <h3 className={styles.cardTitle}>Revise Automatically</h3>
            <p className={styles.cardText}>
              Your solved problem immediately appears on your dashboard, complete with key revision notes, solutions, and category tags.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
