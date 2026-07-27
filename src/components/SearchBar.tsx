"use client";

import { Search, X } from "lucide-react";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  setDifficulty: (diff: "All" | "Easy" | "Medium" | "Hard") => void;
  revisionStatus: "All" | "Revised" | "Not Revised";
  setRevisionStatus: (status: "All" | "Revised" | "Not Revised") => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  difficulty,
  setDifficulty,
  revisionStatus,
  setRevisionStatus,
  onClearFilters,
  hasActiveFilters
}: SearchBarProps) {
  const difficulties: Array<"All" | "Easy" | "Medium" | "Hard"> = ["All", "Easy", "Medium", "Hard"];
  const statuses: Array<"All" | "Revised" | "Not Revised"> = ["All", "Revised", "Not Revised"];

  return (
    <div className={styles.cardContainer}>
      {/* Search Input */}
      <div className={styles.searchGroup}>
        <div className={styles.searchIconWrapper}>
          <Search className={styles.searchIcon} />
        </div>
        <input
          type="text"
          placeholder="Search by problem name, number, topic or language..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className={styles.clearInputButton}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Row of Tabs */}
      <div className={styles.filterRow}>
        {/* Difficulty Filter */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Difficulty</span>
          <div className={styles.tabWrapper}>
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`${styles.tabButton} ${difficulty === diff ? styles.tabButtonActive : ""}`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Revision Filter */}
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Revision Status</span>
          <div className={styles.tabWrapper}>
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setRevisionStatus(status)}
                className={`${styles.tabButton} ${revisionStatus === status ? styles.tabButtonActive : ""}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className={styles.clearFiltersWrapper}>
            <button
              onClick={onClearFilters}
              className={styles.clearFiltersButton}
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
