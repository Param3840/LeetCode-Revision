"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Star,
  CheckCircle2,
  BookOpen,
  Code2,
  LogOut,
  ExternalLink,
  Trash2,
  Edit3,
  Layers,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  FileText,
  Copy,
  Check
} from "lucide-react";

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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modal State
  const [activeNotesModal, setActiveNotesModal] = useState<Submission | null>(null);
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const [activeSolutionModal, setActiveSolutionModal] = useState<Submission | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

    return { total, easy, medium, hard, favorites, mastered };
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
        // Search query
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

        // Difficulty filter
        if (selectedDifficulty !== "all") {
          if (sub.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) {
            return false;
          }
        }

        // Language filter
        if (selectedLanguage !== "all") {
          if (sub.language?.toLowerCase() !== selectedLanguage.toLowerCase()) {
            return false;
          }
        }

        // Topic Tag filter
        if (selectedTopic !== "all") {
          if (!sub.tags || !sub.tags.includes(selectedTopic)) {
            return false;
          }
        }

        // Revision Status filter
        if (selectedStatus !== "all") {
          if ((sub.revisionStatus || "New") !== selectedStatus) {
            return false;
          }
        }

        // Favorites filter
        if (showFavoritesOnly && !sub.favorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
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
    showFavoritesOnly,
    sortOrder
  ]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-[#233807] font-sans pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#233807] text-[#fdfdfd] px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-[#FFF8B9]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#ffffff]/90 backdrop-blur-xl border-b border-[#233807]/10 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#233807] p-0.5 shadow-md flex items-center justify-center text-[#fdfdfd]">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#233807]">
                Code<span className="text-[#34540a]">Revise</span>
              </span>
              <span className="ml-2 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#233807] text-[#fdfdfd]">
                Dashboard
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#233807]/50" />
            <input
              type="text"
              placeholder="Search problem #, title, tag, or language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#233807] placeholder-[#233807]/40 focus:outline-none focus:border-[#233807] focus:ring-1 focus:ring-[#233807] transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#233807]/60 hover:text-[#233807]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-[#ffffff] border border-[#233807]/15 px-3.5 py-1.5 rounded-xl shadow-sm">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="h-8 w-8 rounded-full border border-[#233807]/30 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#233807] text-[#fdfdfd] flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name[0] : "U"}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#233807] leading-tight">{user?.name || "Student"}</p>
                <p className="text-[10px] text-[#233807]/70 truncate max-w-[120px]">{user?.email || ""}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 hover:bg-red-500/20 transition-all cursor-pointer"
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
          
          <div className="bg-[#ffffff] border border-[#233807]/12 rounded-2xl p-4 shadow-sm backdrop-blur-lg hover:border-[#233807]/30 transition-all">
            <div className="flex items-center justify-between text-[#233807]/70 text-xs font-semibold">
              <span>Total Problems</span>
              <Layers className="h-4 w-4 text-[#233807]" />
            </div>
            <p className="text-2xl font-extrabold text-[#233807] mt-2">{stats.total}</p>
          </div>

          <div className="bg-[#ffffff] border border-emerald-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-lg hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
              <span>Easy</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-2">{stats.easy}</p>
          </div>

          <div className="bg-[#ffffff] border border-amber-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-lg hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
              <span>Medium</span>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600"></span>
            </div>
            <p className="text-2xl font-extrabold text-amber-700 mt-2">{stats.medium}</p>
          </div>

          <div className="bg-[#ffffff] border border-rose-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-lg hover:border-rose-500/40 transition-all">
            <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
              <span>Hard</span>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600"></span>
            </div>
            <p className="text-2xl font-extrabold text-rose-700 mt-2">{stats.hard}</p>
          </div>

          <div className="bg-[#ffffff] border border-yellow-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-lg hover:border-yellow-500/40 transition-all">
            <div className="flex items-center justify-between text-yellow-800 text-xs font-semibold">
              <span>Starred</span>
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            </div>
            <p className="text-2xl font-extrabold text-yellow-600 mt-2">{stats.favorites}</p>
          </div>

          <div className="bg-[#ffffff] border border-purple-500/20 rounded-2xl p-4 shadow-sm backdrop-blur-lg hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between text-purple-800 text-xs font-semibold">
              <span>Mastered</span>
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-purple-700 mt-2">{stats.mastered}</p>
          </div>

        </div>

        {/* Filter Controls Toolbar */}
        <div className="bg-[#ffffff] border border-[#233807]/12 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#233807]/10 pb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#233807]">
              <Filter className="h-4 w-4 text-[#233807]" />
              <span>Filters & Customization</span>
            </div>

            {/* Favorites Toggle Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showFavoritesOnly
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-800"
                  : "bg-[#233807]/5 border-[#233807]/15 text-[#233807] hover:bg-[#233807]/10"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? "fill-yellow-500 text-yellow-500" : ""}`} />
              <span>{showFavoritesOnly ? "Showing Favorites Only" : "Favorites Only"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Difficulty Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#233807]/70 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-xl px-3 py-2 text-xs text-[#233807] focus:outline-none focus:border-[#233807]"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Language Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#233807]/70 mb-1">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-xl px-3 py-2 text-xs text-[#233807] focus:outline-none focus:border-[#233807]"
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
              <label className="block text-[11px] font-bold text-[#233807]/70 mb-1">Topic Tag</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-xl px-3 py-2 text-xs text-[#233807] focus:outline-none focus:border-[#233807]"
              >
                <option value="all">All Topics</option>
                {uniqueTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            {/* Revision Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-[#233807]/70 mb-1">Revision Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-xl px-3 py-2 text-xs text-[#233807] focus:outline-none focus:border-[#233807]"
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="Learning">Learning</option>
                <option value="Revising">Revising</option>
                <option value="Mastered">Mastered</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] font-bold text-[#233807]/70 mb-1">Sort By</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-xl px-3 py-2 text-xs text-[#233807] focus:outline-none focus:border-[#233807]"
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
                className="bg-[#ffffff] border border-[#233807]/10 rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-[#233807]/10 rounded w-1/3"></div>
                <div className="h-6 bg-[#233807]/10 rounded w-3/4"></div>
                <div className="h-4 bg-[#233807]/10 rounded w-1/2"></div>
                <div className="h-10 bg-[#233807]/5 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-700 p-4 rounded-2xl text-center text-sm font-medium">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSubmissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 bg-[#ffffff] border border-[#233807]/12 rounded-3xl shadow-sm max-w-lg mx-auto py-16"
          >
            <div className="h-16 w-16 bg-[#233807]/10 rounded-2xl border border-[#233807]/20 flex items-center justify-center text-[#233807] mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-[#233807] tracking-tight">No Submissions Found</h3>
            <p className="text-xs text-[#233807]/70 mt-2 max-w-xs leading-relaxed">
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
                    className="group bg-[#ffffff] border border-[#233807]/12 hover:border-[#233807]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Badge & Favorite Star */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#233807]/5 border border-[#233807]/15 text-[#233807]">
                          #{sub.problemNumber || "N/A"}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              isEasy
                                ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/30"
                                : isMedium
                                ? "bg-amber-500/10 text-amber-800 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-800 border-rose-500/30"
                            }`}
                          >
                            {sub.difficulty}
                          </span>

                          <button
                            onClick={() => handleToggleFavorite(sub)}
                            className="p-1.5 rounded-lg bg-[#233807]/5 hover:bg-[#233807]/10 text-[#233807]/60 hover:text-yellow-600 transition-colors cursor-pointer"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                sub.favorite ? "fill-yellow-500 text-yellow-500" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => router.push(`/problems/${sub.problemNumber || sub.slug}`)}
                        className="text-base font-bold text-[#233807] group-hover:text-[#34540a] transition-colors line-clamp-1 cursor-pointer"
                      >
                        {sub.title}
                      </h3>

                      {/* Meta Pills */}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#233807] bg-[#233807]/5 border border-[#233807]/15 px-2.5 py-1 rounded-lg">
                          {sub.language}
                        </span>

                        {sub.tags && sub.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium text-[#233807]/80 bg-[#233807]/5 border border-[#233807]/10 px-2 py-0.5 rounded-md"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Revision Status Selector */}
                      <div className="mt-4 pt-3 border-t border-[#233807]/10 flex items-center justify-between text-xs">
                        <span className="text-[#233807]/70 font-medium">Status</span>
                        <select
                          value={sub.revisionStatus || "New"}
                          onChange={(e) => handleUpdateRevisionStatus(sub._id, e.target.value)}
                          className="bg-[#ffffff] border border-[#233807]/20 text-[#233807] text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#233807] cursor-pointer"
                        >
                          <option value="New">New</option>
                          <option value="Learning">Learning</option>
                          <option value="Revising">Revising</option>
                          <option value="Mastered">Mastered</option>
                        </select>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="mt-5 pt-4 border-t border-[#233807]/10 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#233807]/60 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(sub.submittedAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => router.push(`/problems/${sub.problemNumber || sub.slug}`)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#233807] hover:bg-[#34540a] text-[#fdfdfd] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </button>

                        <button
                          onClick={() => setActiveSolutionModal(sub)}
                          className="px-3 py-1.5 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/12 text-[#233807] text-xs font-bold border border-[#233807]/15 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Code</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveNotesModal(sub);
                            setNotesText(sub.notes || "");
                          }}
                          className="p-1.5 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/12 text-[#233807] border border-[#233807]/15 transition-all cursor-pointer"
                          title="Notes"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(sub._id)}
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233807]/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] border border-[#233807]/20 rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-[#233807]"
            >
              <div className="flex items-center justify-between border-b border-[#233807]/10 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#233807]">
                    #{activeSolutionModal.problemNumber} {activeSolutionModal.title}
                  </h3>
                  <span className="text-xs text-[#233807]/70 font-semibold">
                    Language: {activeSolutionModal.language} | Submitted: {formatDate(activeSolutionModal.submittedAt)}
                  </span>
                </div>
                <button
                  onClick={() => setActiveSolutionModal(null)}
                  className="p-2 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/10 text-[#233807] transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#182605] text-[#fdfdfd] p-5 rounded-2xl font-mono text-xs leading-relaxed relative">
                <button
                  onClick={() => handleCopyCode(activeSolutionModal.solution)}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-[#ffffff]/10 hover:bg-[#ffffff]/20 text-[#fdfdfd] text-xs font-sans flex items-center gap-1.5 cursor-pointer border border-[#ffffff]/20"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233807]/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] border border-[#233807]/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-[#233807] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#233807]/10 pb-3">
                <h3 className="text-base font-bold text-[#233807]">
                  Notes — #{activeNotesModal.problemNumber} {activeNotesModal.title}
                </h3>
                <button
                  onClick={() => setActiveNotesModal(null)}
                  className="p-1.5 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/10 text-[#233807]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <textarea
                rows={6}
                placeholder="Write your revision notes, time complexity, key observations, or mistakes..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-2xl p-4 text-xs text-[#233807] focus:outline-none focus:border-[#233807] resize-none"
              ></textarea>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveNotesModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/10 text-[#233807] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-4 py-2 rounded-xl bg-[#233807] hover:bg-[#34540a] text-[#fdfdfd] text-xs font-bold cursor-pointer shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233807]/30 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ffffff] border border-red-500/20 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl text-[#233807] space-y-4"
            >
              <div className="h-12 w-12 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-[#233807]">Delete Submission?</h4>
              <p className="text-xs text-[#233807]/70">This action will remove the submission from your CodeRevise library.</p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/10 text-[#233807] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSubmission(deleteConfirmId)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
