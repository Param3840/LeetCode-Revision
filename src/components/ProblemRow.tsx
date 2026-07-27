"use client";

import { motion } from "framer-motion";
import { Check, ArrowUpRight } from "lucide-react";
import { SolvedProblem } from "@/lib/github";
import styles from "./ProblemRow.module.css";

interface ProblemRowProps {
  problem: SolvedProblem;
  isRevised: boolean;
  onToggleRevision: (id: number, e: React.MouseEvent) => void;
  onClick: () => void;
}

export default function ProblemRow({
  problem,
  isRevised,
  onToggleRevision,
  onClick
}: ProblemRowProps) {
  
  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "text-emerald-700 bg-emerald-500/10 border-emerald-500/20";
      case "Medium":
        return "text-amber-700 bg-amber-500/10 border-amber-500/20";
      case "Hard":
        return "text-rose-700 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  return (
    <motion.tr
      onClick={onClick}
      className={styles.row}
      whileHover={{ x: 2 }}
    >
      {/* 1. Revision State Toggle */}
      <td className={styles.toggleCell} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => onToggleRevision(problem.id, e)}
          className={`${styles.checkbox} ${isRevised ? styles.checkboxChecked : ""}`}
          title={isRevised ? "Mark as Not Revised" : "Mark as Revised"}
        >
          <Check className={`${styles.checkIcon} ${isRevised ? "scale-100" : "scale-0"} transition-transform`} />
        </button>
      </td>

      {/* 2. Number & Title */}
      <td className={styles.titleCell}>
        <div className={styles.titleGroup}>
          <span className={styles.number}>
            {problem.id.toString().padStart(4, "0")}
          </span>
          <span className={`${styles.title} ${isRevised ? styles.titleChecked : ""}`}>
            {problem.title}
          </span>
        </div>
      </td>

      {/* 3. Difficulty */}
      <td className={styles.difficultyCell}>
        <span className={`${styles.difficultyBadge} ${getDifficultyStyles(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </td>

      {/* 4. Topics */}
      <td className={styles.topicsCell}>
        <div className={styles.topicList}>
          {problem.topics.slice(0, 3).map((topic) => (
            <span
              key={topic}
              className={styles.topicBadge}
            >
              {topic}
            </span>
          ))}
          {problem.topics.length > 3 && (
            <span className={styles.moreBadge}>
              +{problem.topics.length - 3} more
            </span>
          )}
          {problem.topics.length === 0 && (
            <span className={styles.noTags}>No topic tags</span>
          )}
        </div>
      </td>

      {/* 5. Language Badge & Arrow */}
      <td className={styles.languageCell}>
        <div className={styles.langGroup}>
          <div className={styles.langList}>
            {Array.from(new Set(problem.solutions.map((s) => s.language))).map((lang) => (
              <span
                key={lang}
                className={styles.langBadge}
              >
                {lang}
              </span>
            ))}
          </div>
          <ArrowUpRight className={styles.arrowIcon} />
        </div>
      </td>
    </motion.tr>
  );
}
