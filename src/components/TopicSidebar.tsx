"use client";

import { useMemo } from "react";
import { SolvedProblem } from "@/lib/github";
import { Hash, Layers } from "lucide-react";
import styles from "./TopicSidebar.module.css";

interface TopicSidebarProps {
  problems: SolvedProblem[];
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
}

export default function TopicSidebar({
  problems,
  selectedTopic,
  onSelectTopic
}: TopicSidebarProps) {
  // Compute topics and their solved problem counts
  const topicsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    problems.forEach((problem) => {
      problem.topics.forEach((topic) => {
        counts[topic] = (counts[topic] || 0) + 1;
      });
    });

    // Convert to array and sort by count descending
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [problems]);

  const totalCount = problems.length;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.stickyContainer}>
        <h3 className={styles.sidebarTitle}>
          <Layers className={styles.titleIcon} />
          <span>Filter by Topics</span>
        </h3>

        <div className={styles.listGroup}>
          {/* All Topics Option */}
          <button
            onClick={() => onSelectTopic("All Topics")}
            className={`${styles.optionButton} ${
              selectedTopic === "All Topics" || selectedTopic === "All" || !selectedTopic
                ? styles.optionButtonActive
                : ""
            }`}
          >
            <span className="truncate">All Topics</span>
            <span className={styles.badge}>
              {totalCount}
            </span>
          </button>

          {/* Individual Topics */}
          {topicsWithCounts.map(({ name, count }) => {
            const isSelected = selectedTopic === name;
            return (
              <button
                key={name}
                onClick={() => onSelectTopic(name)}
                className={`${styles.optionButton} ${isSelected ? styles.optionButtonActive : ""}`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-zinc-400 shrink-0" />
                  {name}
                </span>
                <span className={styles.badge}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
