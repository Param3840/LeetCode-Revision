"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import styles from "./RevisionProgress.module.css";

interface RevisionProgressProps {
  revisedCount: number;
  totalCount: number;
}

export default function RevisionProgress({ revisedCount, totalCount }: RevisionProgressProps) {
  const percentage = totalCount > 0 ? Math.round((revisedCount / totalCount) * 100) : 0;
  const remaining = totalCount - revisedCount;

  return (
    <div className={styles.progressCard}>
      <div className={styles.infoRow}>
        {/* Info */}
        <div className={styles.infoContent}>
          <div className={styles.iconWrapper}>
            <CheckCircle2 className={styles.checkIcon} />
          </div>
          <div>
            <h3 className={styles.progressTitle}>Revision Completion</h3>
            <p className={styles.progressSubtitle}>Keep track of your interview readiness</p>
          </div>
        </div>

        {/* Count labels */}
        <div className={styles.countsRow}>
          <div className={styles.countItem}>
            <span className={styles.countNumber}>{revisedCount}</span>
            <span className={styles.countDivider}>/</span>
            <span className={styles.countLabel}>{totalCount} solved</span>
          </div>
          <div className={styles.verticalDivider} />
          <div className={styles.remainingGroup}>
            <span className={styles.remainingLabel}>Remaining</span>
            <span className={styles.remainingCount}>{remaining} problems</span>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-5">
        <div className={styles.progressTrack}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={styles.progressBar}
          />
        </div>
        <div className={styles.progressLabels}>
          <span>0%</span>
          <span className={styles.completionText}>{percentage}% Complete</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
