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
            CodeRevise reads solved problems directly from your GitHub repository. Follow these 4 simple steps to link LeetCode, GitHub, and CodeRevise together.
          </p>
        </div>

        {/* Steps Grid */}
        <div className={styles.grid}>
          {/* Step 1 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>1</div>
            <h3 className={styles.cardTitle}>Install LeetHub</h3>
            <p className={styles.cardText}>
              Download the free <a href="https://chrome.google.com/webstore/detail/leethub/aciombocjflgdggbefoncaipakajjgap" target="_blank" rel="noopener noreferrer" className={styles.textLink}>LeetHub Chrome Extension</a>. This extension automatically syncs your LeetCode submissions directly to GitHub.
            </p>
          </div>

          {/* Step 2 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>2</div>
            <h3 className={styles.cardTitle}>Link GitHub Repo</h3>
            <p className={styles.cardText}>
              Create a new <strong>public</strong> repository on GitHub (e.g. <code>my-leetcode-solutions</code>). Open the LeetHub extension and link it to this repository.
            </p>
          </div>

          {/* Step 3 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>3</div>
            <h3 className={styles.cardTitle}>Solve & Submit</h3>
            <p className={styles.cardText}>
              Head over to LeetCode and solve a problem. Once your solution passes all test cases with a successful "Accept", LeetHub will immediately commit it to your GitHub repo.
            </p>
          </div>

          {/* Step 4 */}
          <div className={styles.stepCard}>
            <div className={styles.numberBadge}>4</div>
            <h3 className={styles.cardTitle}>Load on CodeRevise</h3>
            <p className={styles.cardText}>
              Copy your GitHub repository URL, paste it into CodeRevise above, and hit "Analyze". Your dashboard is ready with all your solved questions automatically categorized!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
