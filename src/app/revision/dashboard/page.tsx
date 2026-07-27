"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, SlidersHorizontal, RefreshCw, Ban, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatsCards from "@/components/StatsCards";
import RevisionProgress from "@/components/RevisionProgress";
import SearchBar from "@/components/SearchBar";
import TopicSidebar from "@/components/TopicSidebar";
import ProblemRow from "@/components/ProblemRow";
import ResetRevisionModal from "@/components/ResetRevisionModal";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import { getRepoCache, getCurrentRepoUrl, getRevisedProblems, markProblemRevision, resetRevisionProgress } from "@/lib/storage";
import { RepositoryDetails, SolvedProblem } from "@/lib/github";
import { filterProblems } from "@/lib/filters";
import styles from "./page.module.css";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Core State
  const [repoDetails, setRepoDetails] = useState<RepositoryDetails | null>(null);
  const [revisedIds, setRevisedIds] = useState<number[]>([]);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // 2. Load repo and revision states from localStorage
  useEffect(() => {
    const currentUrl = getCurrentRepoUrl();
    if (!currentUrl) {
      router.replace("/");
      return;
    }

    // Parse owner and repo name from URL
    const urlParts = currentUrl.replace(/\.git$/, "").split("github.com/")[1]?.split("/");
    if (!urlParts || urlParts.length < 2) {
      router.replace("/");
      return;
    }

    const owner = urlParts[0];
    const repo = urlParts[1];
    const cachedData = getRepoCache(owner, repo);

    if (!cachedData) {
      router.replace("/");
      return;
    }

    setRepoDetails(cachedData);
    setRevisedIds(getRevisedProblems(owner, repo));
  }, [router]);

  // 3. Filter States synchronized with URL Search Parameters
  const searchQuery = searchParams.get("q") || "";
  const difficulty = (searchParams.get("difficulty") as "All" | "Easy" | "Medium" | "Hard") || "All";
  const revisionStatus = (searchParams.get("status") as "All" | "Revised" | "Not Revised") || "All";
  const selectedTopic = searchParams.get("topic") || "All Topics";

  // Helper to update individual URL search parameters cleanly
  const updateFilterParam = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "All" && value !== "All Topics") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/revision/dashboard?${params.toString()}`);
  };

  const setSearchQuery = (val: string) => updateFilterParam("q", val);
  const setDifficulty = (val: "All" | "Easy" | "Medium" | "Hard") => updateFilterParam("difficulty", val);
  const setRevisionStatus = (val: "All" | "Revised" | "Not Revised") => updateFilterParam("status", val);
  const setSelectedTopic = (val: string) => updateFilterParam("topic", val);

  const clearFilters = () => {
    router.replace("/revision/dashboard");
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== "" ||
      difficulty !== "All" ||
      revisionStatus !== "All" ||
      (selectedTopic !== "All Topics" && selectedTopic !== "All")
    );
  }, [searchQuery, difficulty, revisionStatus, selectedTopic]);

  // 4. Calculate dynamic counts from problems list
  const problems = repoDetails?.problems || [];
  const stats = useMemo(() => {
    let easy = 0, medium = 0, hard = 0;
    problems.forEach((p) => {
      if (p.difficulty === "Easy") easy++;
      else if (p.difficulty === "Medium") medium++;
      else if (p.difficulty === "Hard") hard++;
    });
    return { total: problems.length, easy, medium, hard };
  }, [problems]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return filterProblems(problems, {
      searchQuery,
      difficulty,
      revisionStatus,
      topic: selectedTopic,
      revisedIds
    });
  }, [problems, searchQuery, difficulty, revisionStatus, selectedTopic, revisedIds]);

  // Count topic list with problem count
  const topicsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    problems.forEach((problem) => {
      problem.topics.forEach((topic) => {
        counts[topic] = (counts[topic] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [problems]);

  // 5. Revision Action Handlers
  const handleToggleRevision = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!repoDetails) return;
    const isCurrentlyRevised = revisedIds.includes(id);
    const updated = markProblemRevision(repoDetails.owner, repoDetails.repo, id, !isCurrentlyRevised);
    setRevisedIds(updated);
  };

  const handleResetRevision = () => {
    if (!repoDetails) return;
    resetRevisionProgress(repoDetails.owner, repoDetails.repo);
    setRevisedIds([]);
  };

  if (!repoDetails) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loaderContent}>
          <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
          <span>Loading revision workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        
        {/* Header Section */}
        <header className={styles.headerSection}>
          <div>
            <div className={styles.headerMeta}>
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Revision dashboard</span>
            </div>
            <h1 className={styles.headerTitle}>
              Interview Revision
            </h1>
            <p className={styles.headerSubtitle}>
              Repository:{" "}
              <a
                href={`https://github.com/${repoDetails.owner}/${repoDetails.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.metaLink}
              >
                {repoDetails.owner}/{repoDetails.repo}
              </a>
            </p>
          </div>

          <div className={styles.actionsGroup}>
            <button
              onClick={() => router.push("/")}
              className={styles.outlineButton}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Change Repository</span>
            </button>
            
            <button
              onClick={() => setIsResetOpen(true)}
              className={styles.dangerButton}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Revision</span>
            </button>
          </div>
        </header>

        {/* Dynamic Stats Cards */}
        <div className="space-y-8">
          <StatsCards
            total={stats.total}
            easy={stats.easy}
            medium={stats.medium}
            hard={stats.hard}
          />

          {/* Revision Progress Section */}
          <RevisionProgress
            revisedCount={revisedIds.length}
            totalCount={stats.total}
          />

          {/* Filtering controls */}
          <div className={styles.mobileFilterBar}>
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className={styles.mobileFilterButton}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
              <span>Filter Problems</span>
              {hasActiveFilters && (
                <span className={styles.badgeDot} />
              )}
            </button>
          </div>

          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            revisionStatus={revisionStatus}
            setRevisionStatus={setRevisionStatus}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Problems layout */}
          <div className={styles.layoutGroup}>
            {/* Left Main Content Table */}
            <div className={styles.tableContainer}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.thStatus}>Status</th>
                      <th className={styles.thName}>Problem Name</th>
                      <th className={styles.thDiff}>Difficulty</th>
                      <th className={styles.thTopics}>Topics</th>
                      <th className={styles.thLangs}>Languages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProblems.map((problem) => (
                      <ProblemRow
                        key={problem.id}
                        problem={problem}
                        isRevised={revisedIds.includes(problem.id)}
                        onToggleRevision={handleToggleRevision}
                        onClick={() => router.push(`/revision/problem/${problem.id}`)}
                      />
                    ))}

                    {filteredProblems.length === 0 && (
                      <tr>
                        <td colSpan={5} className={styles.emptyRow}>
                          <div className={styles.emptyIconWrapper}>
                            <Ban className={styles.emptyIcon} />
                          </div>
                          <h4 className={styles.emptyTitle}>No problems found</h4>
                          <p className={styles.emptyText}>
                            No solved problems matched your active filters. Try clearing your filters or writing a different search query.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Topic Sidebar */}
            <div className="hidden md:block">
              <TopicSidebar
                problems={problems}
                selectedTopic={selectedTopic}
                onSelectTopic={setSelectedTopic}
              />
            </div>
          </div>
        </div>

        {/* Confirmation Reset Modal */}
        <ResetRevisionModal
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          onConfirm={handleResetRevision}
        />

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={isMobileFiltersOpen}
          onClose={() => setIsMobileFiltersOpen(false)}
          problems={problems}
          selectedTopic={selectedTopic}
          onSelectTopic={setSelectedTopic}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          revisionStatus={revisionStatus}
          setRevisionStatus={setRevisionStatus}
          topicsWithCounts={topicsWithCounts}
        />

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className={styles.loaderWrapper}>
            <div className={styles.loaderContent}>
              <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
              <span>Loading workspace settings...</span>
            </div>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
      <Footer />
    </>
  );
}
