"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Star,
  BookOpen,
  Code2,
  LogOut,
  Trash2,
  Edit3,
  Layers,
  Award,
  Clock,
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw
} from "lucide-react";
import Navbar from "@/components/Navbar";
import styles from "./RevisionDashboard.module.css";

interface Submission {
  _id: string;
  problemNumber: string;
  title: string;
  slug: string;
  url: string;
  difficulty: string;
  tags: string[];
  language: string;
  solution: string;
  submittedAt: string;
  favorite: boolean;
  notes: string;
  revisionStatus: "New" | "Learning" | "Revising" | "Mastered";
  lastReviewed: string | null;
  reviewCount: number;
  isRevised?: boolean;
  revisionCount?: number;
  lastRevisionDate?: string | null;
  revisionHistory?: Array<{ revisedAt: string }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

const BACKEND_URL = "http://localhost:5000";

export default function RevisionDashboard() {
  const router = useRouter();

  // 1. Local State
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRevisionFilter, setSelectedRevisionFilter] = useState<"all" | "revised" | "not_revised">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest" | "recently_revised" | "oldest_revision" | "most_revised" | "least_revised"
  >("newest");

  // Modal State
  const [activeNotesModal, setActiveNotesModal] = useState<Submission | null>(null);
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [activeSolutionModal, setActiveSolutionModal] = useState<Submission | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetRevisionConfirmId, setResetRevisionConfirmId] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 2. Load User Profile & Submissions on Mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user session");
      }
    }

    fetchSubmissions(token);
  }, [router]);

  // Fetch Submissions from Backend API
  const fetchSubmissions = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const json = await response.json();
      if (json.success) {
        setSubmissions(json.data || []);
      } else {
        throw new Error(json.message || "Failed to load data");
      }
    } catch (err: any) {
      console.error("Error loading submissions:", err);
      setError(err.message || "Could not connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  // Toggle Favorite API
  const handleToggleFavorite = async (submission: Submission) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newFavState = !submission.favorite;
    setSubmissions((prev) =>
      prev.map((item) =>
        item._id === submission._id ? { ...item, favorite: newFavState } : item
      )
    );

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${submission._id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ favorite: newFavState })
      });

      if (res.ok) {
        showToast(newFavState ? "Starred submission" : "Unstarred submission");
      } else {
        fetchSubmissions(token); // Revert
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
      fetchSubmissions(token);
    }
  };

  // Update Revision Status API
  const handleUpdateRevisionStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmissions((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              revisionStatus: newStatus as any,
              reviewCount: (item.reviewCount || 0) + 1,
              lastReviewed: new Date().toISOString()
            }
          : item
      )
    );

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${id}/revision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ revisionStatus: newStatus })
      });

      if (res.ok) {
        showToast(`Revision status updated to ${newStatus}`);
      } else {
        fetchSubmissions(token);
      }
    } catch (e) {
      console.error("Error updating revision status:", e);
      fetchSubmissions(token);
    }
  };

  // Mark Revision API (Optimistic UI)
  const handleMarkRevised = async (submission: Submission) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const now = new Date().toISOString();
    const newCount = (submission.revisionCount || 0) + 1;
    const newHistory = [{ revisedAt: now }, ...(submission.revisionHistory || [])];

    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((item) =>
        item._id === submission._id
          ? {
              ...item,
              isRevised: true,
              revisionCount: newCount,
              lastRevisionDate: now,
              revisionHistory: newHistory
            }
          : item
      )
    );
    showToast(`✓ Revision #${newCount} recorded!`);

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${submission._id}/revise`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        fetchSubmissions(token); // Revert on failure
        showToast("Failed to record revision");
      }
    } catch (e) {
      console.error("Error marking revision:", e);
      fetchSubmissions(token); // Revert
      showToast("Network error recording revision");
    }
  };

  // Reset Revision History API (Optimistic UI)
  const handleResetRevision = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Optimistic UI update
    setSubmissions((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              isRevised: false,
              revisionCount: 0,
              lastRevisionDate: null,
              revisionHistory: []
            }
          : item
      )
    );
    showToast("Revision history reset!");
    setResetRevisionConfirmId(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${id}/reset-revision`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        fetchSubmissions(token);
        showToast("Failed to reset revision");
      }
    } catch (e) {
      console.error("Error resetting revision:", e);
      fetchSubmissions(token);
      showToast("Network error resetting revision");
    }
  };

  // Save Notes API
  const handleSaveNotes = async () => {
    if (!activeNotesModal) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsSavingNotes(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${activeNotesModal._id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: notesText })
      });

      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((item) =>
            item._id === activeNotesModal._id ? { ...item, notes: notesText } : item
          )
        );
        showToast("Notes saved successfully");
        setActiveNotesModal(null);
      } else {
        showToast("Failed to save notes");
      }
    } catch (e) {
      console.error("Error saving notes:", e);
      showToast("Network error while saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete Submission API
  const handleDeleteSubmission = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        setSubmissions((prev) => prev.filter((item) => item._id !== id));
        showToast("Submission deleted");
      } else {
        showToast("Failed to delete submission");
      }
    } catch (e) {
      console.error("Error deleting submission:", e);
      showToast("Network error deleting submission");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Copy Code to Clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 3. Derived Statistics & Topics List
  const stats = useMemo(() => {
    const total = submissions.length;
    const easy = submissions.filter((s) => s.difficulty?.toLowerCase() === "easy").length;
    const medium = submissions.filter((s) => s.difficulty?.toLowerCase() === "medium").length;
    const hard = submissions.filter((s) => s.difficulty?.toLowerCase() === "hard").length;
    const favorites = submissions.filter((s) => s.favorite).length;
    const mastered = submissions.filter((s) => s.revisionStatus === "Mastered").length;
    const revised = submissions.filter((s) => s.isRevised).length;

    return { total, easy, medium, hard, favorites, mastered, revised };
  }, [submissions]);

  const uniqueLanguages = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.language) set.add(s.language);
    });
    return Array.from(set);
  }, [submissions]);

  const uniqueTopics = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (Array.isArray(s.tags)) {
        s.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [submissions]);

  // 4. Filtering & Sorting Logic
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          const matchTitle = sub.title?.toLowerCase().includes(query);
          const matchSlug = sub.slug?.toLowerCase().includes(query);
          const matchNum = sub.problemNumber?.toLowerCase().includes(query);
          const matchLang = sub.language?.toLowerCase().includes(query);
          const matchTags = sub.tags?.some((t) => t.toLowerCase().includes(query));

          if (!matchTitle && !matchSlug && !matchNum && !matchLang && !matchTags) {
            return false;
          }
        }

        if (selectedDifficulty !== "all") {
          if (sub.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) {
            return false;
          }
        }

        if (selectedLanguage !== "all") {
          if (sub.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
            return false;
          }
        }

        if (selectedTopic !== "all") {
          if (!sub.tags || !sub.tags.includes(selectedTopic)) {
            return false;
          }
        }

        if (selectedStatus !== "all") {
          if ((sub.revisionStatus || "New") !== selectedStatus) {
            return false;
          }
        }

        if (selectedRevisionFilter === "revised" && !sub.isRevised) {
          return false;
        }

        if (selectedRevisionFilter === "not_revised" && sub.isRevised) {
          return false;
        }

        if (showFavoritesOnly && !sub.favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "recently_revised") {
          const dateA = new Date(a.lastRevisionDate || a.submittedAt).getTime();
          const dateB = new Date(b.lastRevisionDate || b.submittedAt).getTime();
          return dateB - dateA;
        }
        if (sortOrder === "oldest_revision") {
          const dateA = new Date(a.lastRevisionDate || a.submittedAt).getTime();
          const dateB = new Date(b.lastRevisionDate || b.submittedAt).getTime();
          return dateA - dateB;
        }
        if (sortOrder === "most_revised") {
          return (b.revisionCount || 0) - (a.revisionCount || 0);
        }
        if (sortOrder === "least_revised") {
          return (a.revisionCount || 0) - (b.revisionCount || 0);
        }
        const dateA = new Date(a.submittedAt).getTime();
        const dateB = new Date(b.submittedAt).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [
    submissions,
    searchQuery,
    selectedDifficulty,
    selectedLanguage,
    selectedTopic,
    selectedStatus,
    selectedRevisionFilter,
    showFavoritesOnly,
    sortOrder
  ]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className={styles.container}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.toast}
          >
            <Sparkles className="h-4 w-4 text-[#FFF8B9]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Floating Capsule Navbar (Hero Styling) */}
      <Navbar forceTheme="dark-bg" />

      {/* Main Dashboard Workspace */}
      <main className={styles.workspace}>

        {/* Dashboard Search Bar */}
        <div className="relative w-full max-w-xl mx-auto mb-2">
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search problem #, title, tag, or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={styles.searchClear}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Statistics Cards Grid */}
        <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
          
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Total Problems</span>
              <Layers className="h-4 w-4 text-[#FFF8B9]" />
            </div>
            <p className={styles.statNumber}>{stats.total}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Revised</span>
              <Check className="h-4 w-4 text-emerald-400 stroke-[3]" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2">{stats.revised}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Easy</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2">{stats.easy}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Medium</span>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
            </div>
            <p className="text-2xl font-extrabold text-amber-400 mt-2">{stats.medium}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Hard</span>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
            </div>
            <p className="text-2xl font-extrabold text-rose-400 mt-2">{stats.hard}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Starred</span>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-2xl font-extrabold text-yellow-400 mt-2">{stats.favorites}</p>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <span>Mastered</span>
              <Award className="h-4 w-4 text-purple-300" />
            </div>
            <p className="text-2xl font-extrabold text-purple-300 mt-2">{stats.mastered}</p>
          </div>

        </div>

        {/* Filter Controls Toolbar */}
        <div className={styles.filterToolbar}>
          
          <div className={styles.filterHeader}>
            <div className="flex items-center gap-2 text-sm font-bold text-[#FFF8B9]">
              <Filter className="h-4 w-4 text-[#FFF8B9]" />
              <span>Filters & Customization</span>
            </div>

            {/* Favorites Toggle Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showFavoritesOnly
                  ? "bg-yellow-400/20 border-yellow-400/60 text-yellow-300"
                  : "bg-[#FFF8B9]/10 border-[#FFF8B9]/25 text-[#FFF8B9] hover:bg-[#FFF8B9]/20"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? "fill-yellow-400 text-yellow-400" : ""}`} />
              <span>{showFavoritesOnly ? "Showing Favorites Only" : "Favorites Only"}</span>
            </button>
          </div>

          <div className={styles.filterGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            
            {/* Revision Filter */}
            <div>
              <label className={styles.filterLabel}>Revision Filter</label>
              <select
                value={selectedRevisionFilter}
                onChange={(e) => setSelectedRevisionFilter(e.target.value as any)}
                className={styles.selectInput}
              >
                <option value="all">All Problems</option>
                <option value="revised">Revised</option>
                <option value="not_revised">Not Revised</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className={styles.filterLabel}>Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className={styles.filterLabel}>Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">All Languages</option>
                {uniqueLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Tag Filter */}
            <div>
              <label className={styles.filterLabel}>Topic Tag</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className={styles.selectInput}
              >
                <option value="all">All Topics</option>
                {uniqueTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className={styles.filterLabel}>Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className={styles.selectInput}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="recently_revised">Recently Revised</option>
                <option value="oldest_revision">Oldest Revision</option>
                <option value="most_revised">Most Revised</option>
                <option value="least_revised">Least Revised</option>
              </select>
            </div>

          </div>

        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className={styles.cardsGrid}>
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-[#233807] border border-[#FFF8B9]/20 rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-[#FFF8B9]/15 rounded w-1/3"></div>
                <div className="h-6 bg-[#FFF8B9]/15 rounded w-3/4"></div>
                <div className="h-4 bg-[#FFF8B9]/15 rounded w-1/2"></div>
                <div className="h-10 bg-[#FFF8B9]/10 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSubmissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl shadow-sm max-w-lg mx-auto py-16 text-[#FFF8B9]"
          >
            <div className="h-16 w-16 bg-[#FFF8B9]/10 rounded-2xl border border-[#FFF8B9]/20 flex items-center justify-center text-[#FFF8B9] mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-[#FFF8B9] tracking-tight">No Submissions Found</h3>
            <p className="text-xs text-[#FFF8B9]/70 mt-2 max-w-xs leading-relaxed">
              {submissions.length === 0
                ? "No submissions yet. Solve your first LeetCode problem to start building your revision library."
                : "No items match your active filters or search query."}
            </p>
          </motion.div>
        )}

        {/* Submissions Card Grid */}
        {!loading && !error && filteredSubmissions.length > 0 && (
          <div className={styles.cardsGrid}>
            <AnimatePresence>
              {filteredSubmissions.map((sub) => {
                const diffLower = sub.difficulty?.toLowerCase() || "easy";
                const isEasy = diffLower === "easy";
                const isMedium = diffLower === "medium";

                return (
                  <motion.div
                    key={sub._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={styles.problemCard}
                  >
                    {/* Top Badge & Favorite Star */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={styles.problemNumberBadge}>
                          #{sub.problemNumber || "N/A"}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              isEasy
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : isMedium
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            {sub.difficulty}
                          </span>

                          <button
                            onClick={() => handleToggleFavorite(sub)}
                            className="p-1.5 rounded-lg bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9]/80 hover:text-yellow-400 transition-colors cursor-pointer border border-[#FFF8B9]/20"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                sub.favorite ? "fill-yellow-400 text-yellow-400" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => router.push(`/problems/${sub.problemNumber || sub.slug}`)}
                        className={styles.problemTitle}
                      >
                        {sub.title}
                      </h3>

                      {/* Meta Pills */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#FFF8B9] bg-[#FFF8B9]/10 border border-[#FFF8B9]/20 px-2.5 py-1 rounded-lg">
                          {sub.language}
                        </span>

                        {sub.tags && sub.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium text-[#FFF8B9]/90 bg-[#FFF8B9]/10 border border-[#FFF8B9]/15 px-2 py-0.5 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Phase 9: Revision Tracking Section */}
                      <div className={styles.revisionSection}>
                        <div className="flex items-center gap-3">
                          {/* Large Circular Checkbox */}
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleMarkRevised(sub)}
                            className={`${styles.revisionCheckBtn} ${
                              sub.isRevised
                                ? styles.revisionCheckBtnChecked
                                : styles.revisionCheckBtnUnchecked
                            }`}
                            title={sub.isRevised ? "Record Another Revision" : "Mark as Revised"}
                          >
                            {sub.isRevised ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                              >
                                <Check className="h-5 w-5 stroke-[3]" />
                              </motion.div>
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-[#FFF8B9]/30" />
                            )}
                          </motion.button>

                          {/* Revision Status Info */}
                          <div className={styles.revisionInfo}>
                            {sub.isRevised ? (
                              <>
                                <span className={styles.revisionStatusTextRevised}>
                                  <Check className="h-3.5 w-3.5 text-emerald-400 inline" /> Revised
                                </span>
                                <span className={styles.revisionDateText}>
                                  Last revised: {formatDate(sub.lastRevisionDate || sub.submittedAt)}
                                </span>
                                <span className="text-[10px] font-bold text-[#FFF8B9]/90">
                                  Revision Count: {sub.revisionCount || 0}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className={styles.revisionStatusTextNot}>Not Revised</span>
                                <span className={styles.revisionDateText}>Click check to record</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Reset Revision History Button */}
                        <button
                          onClick={() => setResetRevisionConfirmId(sub._id)}
                          className={styles.resetRevisionBtn}
                          title="Reset Revision History"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="mt-5 pt-4 border-t border-[#FFF8B9]/15 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#FFF8B9]/70 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(sub.submittedAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => router.push(`/problems/${sub.problemNumber || sub.slug}`)}
                          className={styles.btnReview}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </button>

                        <button
                          onClick={() => setActiveSolutionModal(sub)}
                          className={styles.btnCode}
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Code</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveNotesModal(sub);
                            setNotesText(sub.notes || "");
                          }}
                          className="p-1.5 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9] border border-[#FFF8B9]/20 transition-all cursor-pointer"
                          title="Notes"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(sub._id)}
                          className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

      </main>

      {/* MODAL 1: Code Viewer Modal */}
      <AnimatePresence>
        {activeSolutionModal && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={styles.modalCard}
              style={{ maxWidth: "48rem", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            >
              <div className="flex items-center justify-between border-b border-[#FFF8B9]/15 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#FFF8B9]">
                    #{activeSolutionModal.problemNumber} {activeSolutionModal.title}
                  </h3>
                  <span className="text-xs text-[#FFF8B9]/70 font-semibold">
                    Language: {activeSolutionModal.language} | Submitted: {formatDate(activeSolutionModal.submittedAt)}
                  </span>
                </div>
                <button
                  onClick={() => setActiveSolutionModal(null)}
                  className="p-2 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9] transition-all cursor-pointer border border-[#FFF8B9]/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className={styles.codeReader}>
                <button
                  onClick={() => handleCopyCode(activeSolutionModal.solution)}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-[#FFF8B9]/20 hover:bg-[#FFF8B9]/30 text-[#FFF8B9] text-xs font-sans flex items-center gap-1.5 cursor-pointer border border-[#FFF8B9]/30"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
                <pre className="whitespace-pre-wrap">{activeSolutionModal.solution}</pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Study Notes Editor Modal */}
      <AnimatePresence>
        {activeNotesModal && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={styles.modalCard}
              style={{ maxWidth: "32rem" }}
            >
              <div className="flex items-center justify-between border-b border-[#FFF8B9]/15 pb-3 mb-3">
                <h3 className="text-base font-bold text-[#FFF8B9]">
                  Notes — #{activeNotesModal.problemNumber} {activeNotesModal.title}
                </h3>
                <button
                  onClick={() => setActiveNotesModal(null)}
                  className="p-1.5 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                rows={6}
                placeholder="Write your revision notes, time complexity, key observations, or mistakes..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full bg-[#121e07] border border-[#FFF8B9]/25 rounded-2xl p-4 text-xs text-[#FFF8B9] placeholder-[#FFF8B9]/40 focus:outline-none focus:border-[#FFF8B9] resize-none"
              ></textarea>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveNotesModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 rounded-xl bg-[#FFF8B9] hover:bg-[#ffffff] text-[#233807] text-xs font-extrabold cursor-pointer shadow-sm"
                >
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={styles.modalCard}
              style={{ maxWidth: "24rem", textAlign: "center" }}
            >
              <div className="h-12 w-12 bg-rose-500/20 text-rose-300 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-500/30">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-[#FFF8B9]">Delete Submission?</h4>
              <p className="text-xs text-[#FFF8B9]/70 mb-4">This action will remove the submission from your CodeRevise library.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSubmission(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Reset Revision History Modal */}
      <AnimatePresence>
        {resetRevisionConfirmId && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={styles.modalCard}
              style={{ maxWidth: "24rem", textAlign: "center" }}
            >
              <div className="h-12 w-12 bg-amber-500/20 text-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                <RotateCcw className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-[#FFF8B9]">Reset revision history?</h4>
              <p className="text-xs text-[#FFF8B9]/70 mb-4">This will remove all revision records for this problem.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setResetRevisionConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetRevision(resetRevisionConfirmId)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
