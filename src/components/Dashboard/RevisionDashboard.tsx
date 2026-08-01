"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  LogOut,
  Star,
  BookOpen,
  Code2,
  Copy,
  Check,
  Trash2,
  FileText,
  ExternalLink,
  Filter,
  Sparkles,
  X,
  Layers,
  Award,
  Clock,
  ChevronDown
} from "lucide-react";

interface Submission {
  _id: string;
  problemNumber: string;
  title: string;
  slug: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  tags: string[];
  language: string;
  solution: string;
  submittedAt: string;
  favorite: boolean;
  notes: string;
  revisionStatus: "New" | "Learning" | "Revising" | "Mastered";
  lastReviewed: string | null;
  reviewCount: number;
}

const BACKEND_URL = "http://localhost:5000";

export default function RevisionDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name?: string; email?: string; picture?: string } | null>(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modals & Active Selections
  const [activeSolutionModal, setActiveSolutionModal] = useState<Submission | null>(null);
  const [activeNotesModal, setActiveNotesModal] = useState<Submission | null>(null);
  const [notesContent, setNotesContent] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Auth & Data Fetching
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
        // Ignore JSON parse error
      }
    }

    fetchSubmissions(token);
  }, [router]);

  const fetchSubmissions = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/submissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/login");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load submissions");
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSubmissions(data.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data from backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  // Optimistic Toggle Favorite
  const handleToggleFavorite = async (sub: Submission) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newFavState = !sub.favorite;

    // Optimistic state update
    setSubmissions((prev) =>
      prev.map((item) => (item._id === sub._id ? { ...item, favorite: newFavState } : item))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${sub._id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ favorite: newFavState })
      });

      if (!res.ok) {
        // Revert on error
        setSubmissions((prev) =>
          prev.map((item) => (item._id === sub._id ? { ...item, favorite: sub.favorite } : item))
        );
        showToast("Failed to update favorite");
      } else {
        showToast(newFavState ? "Starred submission" : "Unstarred submission");
      }
    } catch (e) {
      showToast("Network error updating favorite");
    }
  };

  // Update Revision Status
  const handleUpdateRevisionStatus = async (id: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmissions((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, revisionStatus: newStatus as any } : item
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

      if (!res.ok) {
        showToast("Failed to update status");
      } else {
        showToast(`Status updated to ${newStatus}`);
      }
    } catch (e) {
      showToast("Network error updating status");
    }
  };

  // Save Notes
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
        body: JSON.stringify({ notes: notesContent })
      });

      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((item) =>
            item._id === activeNotesModal._id ? { ...item, notes: notesContent } : item
          )
        );
        showToast("Notes saved successfully!");
        setActiveNotesModal(null);
      } else {
        showToast("Failed to save notes");
      }
    } catch (e) {
      showToast("Network error saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete Submission
  const handleDeleteSubmission = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmissions((prev) => prev.filter((item) => item._id !== id));
    setDeleteConfirmationId(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        showToast("Submission deleted");
      } else {
        showToast("Failed to delete submission");
        fetchSubmissions(token); // Reload if failed
      }
    } catch (e) {
      showToast("Network error deleting submission");
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Derived options for filters
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => s.language && set.add(s.language));
    return ["All", ...Array.from(set)];
  }, [submissions]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => s.tags?.forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [submissions]);

  // Derived Stats
  const stats = useMemo(() => {
    return {
      total: submissions.length,
      easy: submissions.filter((s) => s.difficulty.toLowerCase() === "easy").length,
      medium: submissions.filter((s) => s.difficulty.toLowerCase() === "medium").length,
      hard: submissions.filter((s) => s.difficulty.toLowerCase() === "hard").length,
      favorites: submissions.filter((s) => s.favorite).length,
      mastered: submissions.filter((s) => s.revisionStatus === "Mastered").length
    };
  }, [submissions]);

  // Filtered & Sorted submissions list
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((sub) => {
        // Search Filter
        const query = searchQuery.toLowerCase().trim();
        if (query) {
          const matchNum = sub.problemNumber?.toLowerCase().includes(query);
          const matchTitle = sub.title?.toLowerCase().includes(query);
          const matchLang = sub.language?.toLowerCase().includes(query);
          const matchTag = sub.tags?.some((t) => t.toLowerCase().includes(query));
          if (!matchNum && !matchTitle && !matchLang && !matchTag) {
            return false;
          }
        }

        // Difficulty Filter
        if (selectedDifficulty !== "All" && sub.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) {
          return false;
        }

        // Language Filter
        if (selectedLanguage !== "All" && sub.language !== selectedLanguage) {
          return false;
        }

        // Tag Filter
        if (selectedTag !== "All" && !sub.tags?.includes(selectedTag)) {
          return false;
        }

        // Status Filter
        if (selectedStatus !== "All" && sub.revisionStatus !== selectedStatus) {
          return false;
        }

        // Favorites Only
        if (showFavoritesOnly && !sub.favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.submittedAt).getTime();
        const timeB = new Date(b.submittedAt).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [
    submissions,
    searchQuery,
    selectedDifficulty,
    selectedLanguage,
    selectedTag,
    selectedStatus,
    showFavoritesOnly,
    sortOrder
  ]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-slate-900/90 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-lime-500 p-0.5 shadow-lg shadow-emerald-950/50">
              <div className="h-full w-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                <Code2 className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Code<span className="text-emerald-400">Revise</span>
              </span>
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Dashboard
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search problem #, title, tag, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-emerald-500/40 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0] : "U"}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.name || "Student"}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email || ""}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="bg-[#0D121F]/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Problems</span>
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-100 mt-2">{stats.total}</p>
          </div>

          <div className="bg-[#0D121F]/80 border border-emerald-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
              <span>Easy</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 mt-2">{stats.easy}</p>
          </div>

          <div className="bg-[#0D121F]/80 border border-amber-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
              <span>Medium</span>
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
            </div>
            <p className="text-2xl font-extrabold text-amber-400 mt-2">{stats.medium}</p>
          </div>

          <div className="bg-[#0D121F]/80 border border-rose-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
              <span>Hard</span>
              <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></span>
            </div>
            <p className="text-2xl font-extrabold text-rose-400 mt-2">{stats.hard}</p>
          </div>

          <div className="bg-[#0D121F]/80 border border-yellow-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-yellow-400 text-xs font-medium">
              <span>Starred</span>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-2xl font-extrabold text-yellow-400 mt-2">{stats.favorites}</p>
          </div>

          <div className="bg-[#0D121F]/80 border border-purple-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-lg">
            <div className="flex items-center justify-between text-purple-400 text-xs font-medium">
              <span>Mastered</span>
              <Award className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-extrabold text-purple-400 mt-2">{stats.mastered}</p>
          </div>

        </div>

        {/* Filter Controls Toolbar */}
        <div className="bg-[#0D121F]/80 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-lg space-y-4">
          
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Filter className="h-4 w-4 text-emerald-400" />
              <span>Filters & Customization</span>
            </div>

            {/* Favorites Toggle Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showFavoritesOnly
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? "fill-yellow-400 text-yellow-400" : ""}`} />
              <span>{showFavoritesOnly ? "Showing Favorites Only" : "Favorites Only"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Difficulty Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "All" ? "All Languages" : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Topic Tag</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag === "All" ? "All Topics" : tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Revision Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Revision Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Learning">Learning</option>
                <option value="Revising">Revising</option>
                <option value="Mastered">Mastered</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

          </div>

        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-[#0D121F]/50 border border-white/5 rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-white/10 rounded w-1/3"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-10 bg-white/5 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSubmissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 bg-[#0D121F]/80 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl max-w-lg mx-auto py-16"
          >
            <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight">No Submissions Found</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              {submissions.length === 0
                ? "No submissions yet. Solve your first LeetCode problem to start building your revision library."
                : "No items match your active filters or search query."}
            </p>
          </motion.div>
        )}

        {/* Submissions Card Grid */}
        {!loading && !error && filteredSubmissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="group bg-[#0D121F]/90 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl backdrop-blur-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Badge & Favorite Star */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                          #{sub.problemNumber || "N/A"}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              isEasy
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : isMedium
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {sub.difficulty}
                          </span>

                          <button
                            onClick={() => handleToggleFavorite(sub)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-yellow-400 transition-colors cursor-pointer"
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
                        className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {sub.title}
                      </h3>

                      {/* Meta Pills */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg">
                          {sub.language}
                        </span>

                        {sub.tags && sub.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Revision Status Selector */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Status</span>
                        <select
                          value={sub.revisionStatus || "New"}
                          onChange={(e) => handleUpdateRevisionStatus(sub._id, e.target.value)}
                          className="bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                        >
                          <option value="New">New</option>
                          <option value="Learning">Learning</option>
                          <option value="Revising">Revising</option>
                          <option value="Mastered">Mastered</option>
                        </select>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(sub.submittedAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => router.push(`/problems/${sub.problemNumber || sub.slug}`)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveNotesModal(sub);
                            setNotesContent(sub.notes || "");
                          }}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                          title="Notes"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => handleCopyCode(sub.solution, sub._id)}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedId === sub._id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setDeleteConfirmationId(sub._id)}
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
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

      {/* View Solution Code Modal */}
      <AnimatePresence>
        {activeSolutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D121F] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/10 text-slate-300">
                      #{activeSolutionModal.problemNumber}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {activeSolutionModal.language}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-100 mt-1">
                    {activeSolutionModal.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={activeSolutionModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
                  >
                    <span>LeetCode</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => setActiveSolutionModal(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Code Viewer */}
              <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-200 bg-[#07090E] leading-relaxed">
                <pre className="whitespace-pre-wrap break-words">{activeSolutionModal.solution}</pre>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Submitted: {formatDate(activeSolutionModal.submittedAt)}
                </span>

                <button
                  onClick={() => handleCopyCode(activeSolutionModal.solution, activeSolutionModal._id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Code</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Notes Modal */}
      <AnimatePresence>
        {activeNotesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D121F] border border-white/10 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-100">
                    Personal Notes — #{activeNotesModal.problemNumber} {activeNotesModal.title}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveNotesModal(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <textarea
                rows={8}
                placeholder="Write your key takeaways, time/space complexity notes, or revision hints..."
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none font-sans"
              ></textarea>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveNotesModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D121F] border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Delete Submission?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete this submission? This action cannot be undone and will permanently remove the solution from your account.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmationId(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSubmission(deleteConfirmationId)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
