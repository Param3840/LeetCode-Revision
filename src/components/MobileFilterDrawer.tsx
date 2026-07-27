"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, Hash } from "lucide-react";
import { SolvedProblem } from "@/lib/github";
import styles from "./MobileFilterDrawer.module.css";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  problems: SolvedProblem[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  setDifficulty: (diff: "All" | "Easy" | "Medium" | "Hard") => void;
  revisionStatus: "All" | "Revised" | "Not Revised";
  setRevisionStatus: (status: "All" | "Revised" | "Not Revised") => void;
  topicsWithCounts: Array<{ name: string; count: number }>;
}

export default function MobileFilterDrawer({
  isOpen,
  onClose,
  problems,
  selectedTopic,
  onSelectTopic,
  difficulty,
  setDifficulty,
  revisionStatus,
  setRevisionStatus,
  topicsWithCounts
}: MobileFilterDrawerProps) {
  const difficulties: Array<"All" | "Easy" | "Medium" | "Hard"> = ["All", "Easy", "Medium", "Hard"];
  const statuses: Array<"All" | "Revised" | "Not Revised"> = ["All", "Revised", "Not Revised"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.drawerOverlay}>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={styles.backdrop}
          />

          {/* Drawer content body */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={styles.drawerBody}
          >
            {/* Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.headerTitleGroup}>
                <SlidersHorizontal className={styles.titleIcon} />
                <h3 className={styles.titleText}>Filter Problems</h3>
              </div>
              <button
                onClick={onClose}
                className={styles.closeButton}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={styles.scrollArea}>
              {/* Difficulty */}
              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Difficulty</label>
                <div className={styles.buttonGrid}>
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`${styles.badgeButton} ${difficulty === diff ? styles.badgeButtonActive : ""}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Revision Status */}
              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Revision Status</label>
                <div className={`${styles.buttonGrid} ${styles.grid3}`}>
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setRevisionStatus(status)}
                      className={`${styles.badgeButton} ${revisionStatus === status ? styles.badgeButtonActive : ""}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics Selection */}
              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Topics</label>
                <div className={styles.topicsList}>
                  {/* All topics */}
                  <button
                    onClick={() => {
                      onSelectTopic("All Topics");
                      onClose();
                    }}
                    className={`${styles.topicRowButton} ${
                      selectedTopic === "All Topics" || selectedTopic === "All" || !selectedTopic
                        ? styles.topicRowButtonActive
                        : ""
                    }`}
                  >
                    <span>All Topics</span>
                    <span className={styles.badgeCount}>
                      {problems.length}
                    </span>
                  </button>

                  {/* Individual topics */}
                  {topicsWithCounts.map(({ name, count }) => {
                    const isSelected = selectedTopic === name;
                    return (
                      <button
                        key={name}
                        onClick={() => {
                          onSelectTopic(name);
                          onClose();
                        }}
                        className={`${styles.topicRowButton} ${isSelected ? styles.topicRowButtonActive : ""}`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <Hash className="h-3 w-3 text-zinc-400 shrink-0" />
                          {name}
                        </span>
                        <span className={styles.badgeCount}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
