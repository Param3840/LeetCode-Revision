"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Code2,
  FileText,
  BookOpen,
  Check,
  Copy,
  Download,
  HelpCircle,
  Layers,
  Sparkles,
  Building2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Clock
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface Submission {
  _id: string | null;
  userId: string;
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

interface ProblemMetadata {
  problemNumber: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  companies: string[];
  description: string;
  hints: string[];
  relatedProblems: Array<{
    problemNumber: string;
    title: string;
    slug: string;
    difficulty: string;
  }>;
  lastFetched: string;
}

const BACKEND_URL = "http://localhost:5000";

export default function ProblemDetailView() {
  const router = useRouter();
  const params = useParams();
  const rawParam = params?.problemNumber;
  const problemNumberParam = Array.isArray(rawParam) ? rawParam[0] : rawParam as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [problem, setProblem] = useState<ProblemMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab: 'description' | 'solution' | 'notes'
  const [activeTab, setActiveTab] = useState<"description" | "solution" | "notes">("description");

  // Notes & Modals
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedHints, setExpandedHints] = useState<number[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    if (problemNumberParam) {
      fetchProblemDetails(token, problemNumberParam);
    }
  }, [problemNumberParam, router]);

  const fetchProblemDetails = async (token: string, probNum: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${BACKEND_URL}/api/submissions/${probNum}/details`, {
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
        throw new Error(`Problem #${probNum} details not found.`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setSubmission(json.data.submission);
        setProblem(json.data.problem);
        if (json.data.submission && json.data.submission.notes) {
          setNotesText(json.data.submission.notes);
        }
      } else {
        throw new Error(json.message || "Failed to load details");
      }
    } catch (err: any) {
      setError(err.message || "Error fetching details from server.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!submission || !submission._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const newFav = !submission.favorite;
    setSubmission({ ...submission, favorite: newFav });

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${submission._id}/favorite`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ favorite: newFav })
      });
      if (res.ok) {
        showToast(newFav ? "Starred submission" : "Unstarred submission");
      }
    } catch (e) {
      showToast("Error toggling favorite");
    }
  };

  // Mark Revised (Optimistic UI)
  const handleMarkRevised = async () => {
    if (!submission || !submission._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const now = new Date().toISOString();
    const newCount = (submission.revisionCount || 0) + 1;
    const newHistory = [{ revisedAt: now }, ...(submission.revisionHistory || [])];

    setSubmission({
      ...submission,
      isRevised: true,
      revisionCount: newCount,
      lastRevisionDate: now,
      revisionHistory: newHistory
    });
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
        if (problemNumberParam) fetchProblemDetails(token, problemNumberParam);
      }
    } catch (e) {
      showToast("Error recording revision");
      if (problemNumberParam) fetchProblemDetails(token, problemNumberParam);
    }
  };

  // Reset Revision History (Optimistic UI)
  const handleResetRevision = async () => {
    if (!submission || !submission._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmission({
      ...submission,
      isRevised: false,
      revisionCount: 0,
      lastRevisionDate: null,
      revisionHistory: []
    });
    showToast("Revision history reset!");
    setShowResetConfirm(false);

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${submission._id}/reset-revision`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        if (problemNumberParam) fetchProblemDetails(token, problemNumberParam);
      }
    } catch (e) {
      showToast("Error resetting revision");
      if (problemNumberParam) fetchProblemDetails(token, problemNumberParam);
    }
  };

  // Save Notes
  const handleSaveNotes = async () => {
    if (!submission || !submission._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsSavingNotes(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${submission._id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: notesText })
      });

      if (res.ok) {
        setSubmission({ ...submission, notes: notesText });
        showToast("Notes saved successfully!");
      } else {
        showToast("Failed to save notes");
      }
    } catch (e) {
      showToast("Network error saving notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Copy Solution Code
  const handleCopyCode = () => {
    if (!submission?.solution) return;
    navigator.clipboard.writeText(submission.solution);
    setCopiedCode(true);
    showToast("Code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download Code File
  const handleDownloadCode = () => {
    if (!submission?.solution) return;
    const extMap: Record<string, string> = {
      "Python3": "py",
      "Python": "py",
      "C++": "cpp",
      "Java": "java",
      "JavaScript": "js",
      "TypeScript": "ts",
      "Go": "go",
      "Rust": "rs"
    };
    const ext = extMap[submission.language] || "txt";
    const filename = `Solution_${submission.problemNumber}_${submission.slug}.${ext}`;
    const blob = new Blob([submission.solution], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const toggleHint = (idx: number) => {
    setExpandedHints(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const difficultyClass = (diff: string) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (d === "medium") return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-rose-500/20 text-rose-300 border-rose-500/40";
  };

  return (
    <div className="min-h-screen bg-[#FFF8B9] text-[#233807] font-sans pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-[#233807] text-[#FFF8B9] border border-[#FFF8B9]/30 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-[#FFF8B9]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Floating Capsule Navbar (Hero Styling) */}
      <Navbar forceTheme="dark-bg" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-4 space-y-6">

        {/* Action Header Controls Bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-[#FFF8B9] bg-[#233807] hover:bg-[#34540a] px-4 py-2.5 rounded-xl border border-[#FFF8B9]/25 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            {submission?.url && (
              <a
                href={submission.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#233807] hover:bg-[#34540a] border border-[#FFF8B9]/25 text-xs font-bold text-[#FFF8B9] transition-all shadow-sm"
              >
                <span>Open on LeetCode</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            {submission?._id && (
              <button
                onClick={handleToggleFavorite}
                className="p-2.5 rounded-xl bg-[#233807] hover:bg-[#34540a] border border-[#FFF8B9]/25 text-[#FFF8B9] hover:text-yellow-400 transition-colors cursor-pointer shadow-sm"
                title="Star Favorite"
              >
                <Star
                  className={`h-4 w-4 ${
                    submission.favorite ? "fill-yellow-400 text-yellow-400" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-[#233807]/20 rounded-xl w-1/3"></div>
            <div className="h-40 bg-[#233807] rounded-2xl border border-[#FFF8B9]/20"></div>
          </div>
        )}

        {/* Error Fallback */}
        {!loading && error && (
          <div className="bg-[#233807] border border-rose-500/40 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-md text-[#FFF8B9]">
            <AlertCircle className="h-12 w-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-[#FFF8B9]">Problem Not Found</h3>
            <p className="text-xs text-[#FFF8B9]/70">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-[#FFF8B9] text-[#233807] font-extrabold text-xs cursor-pointer shadow-sm"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {!loading && (submission || problem) && (
          <>
            {/* Problem Overview Header Card */}
            <div className="bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl p-8 shadow-md space-y-6 text-[#FFF8B9]">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-[#FFF8B9]/15 text-[#FFF8B9] border border-[#FFF8B9]/25">
                      #{submission?.problemNumber || problem?.problemNumber}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${difficultyClass(
                        submission?.difficulty || problem?.difficulty || "Medium"
                      )}`}
                    >
                      {submission?.difficulty || problem?.difficulty}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#FFF8B9] tracking-tight">
                    {submission?.title || problem?.title}
                  </h1>
                </div>
              </div>

              {/* Tags & Company Pills */}
              <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-[#FFF8B9]/15">
                {/* Topic Tags */}
                {(problem?.tags || submission?.tags)?.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium text-[#FFF8B9] bg-[#FFF8B9]/10 border border-[#FFF8B9]/20 px-3 py-1 rounded-xl"
                  >
                    {t}
                  </span>
                ))}

                {/* Companies */}
                {problem?.companies && problem.companies.length > 0 && (
                  <div className="flex items-center gap-2 border-l border-[#FFF8B9]/20 pl-4">
                    <Building2 className="h-4 w-4 text-[#FFF8B9]" />
                    {problem.companies.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] font-bold text-[#FFF8B9] bg-[#FFF8B9]/15 border border-[#FFF8B9]/25 px-2.5 py-0.5 rounded-lg"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Phase 9: Revision Tracking Card & Timeline */}
            <div className="bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl p-8 shadow-md space-y-6 text-[#FFF8B9]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFF8B9]/15 pb-6">
                
                {/* Left Revision Status Badge & Check Button */}
                <div className="flex items-center gap-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleMarkRevised}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                      submission?.isRevised
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-[#FFF8B9]/10 border-[#FFF8B9]/35 text-transparent hover:border-emerald-400 hover:bg-emerald-500/10"
                    }`}
                    title={submission?.isRevised ? "Record Another Revision" : "Mark as Revised"}
                  >
                    {submission?.isRevised ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Check className="h-6 w-6 stroke-[3]" />
                      </motion.div>
                    ) : (
                      <span className="h-3 w-3 rounded-full bg-[#FFF8B9]/40" />
                    )}
                  </motion.button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-extrabold ${submission?.isRevised ? "text-emerald-400" : "text-[#FFF8B9]/70"}`}>
                        {submission?.isRevised ? "✓ Revised" : "Not Revised"}
                      </span>
                    </div>
                    <p className="text-xs text-[#FFF8B9]/70 mt-0.5">
                      {submission?.isRevised
                        ? "Click check button anytime to log a new revision iteration."
                        : "Click the circular check button to record your first revision."}
                    </p>
                  </div>
                </div>

                {/* Reset Revision History Button */}
                {submission?._id && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-2 text-xs font-bold text-[#FFF8B9]/80 hover:text-[#FFF8B9] bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 px-3.5 py-2 rounded-xl border border-[#FFF8B9]/20 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Revision History</span>
                  </button>
                )}
              </div>

              {/* Revision Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#121e07] border border-[#FFF8B9]/20 rounded-2xl p-4">
                  <span className="text-xs text-[#FFF8B9]/70 font-semibold block">Last Revision</span>
                  <span className="text-sm font-extrabold text-[#FFF8B9] mt-1 block">
                    {submission?.lastRevisionDate ? formatDate(submission.lastRevisionDate) : (submission?.isRevised ? formatDate(submission.submittedAt) : "None")}
                  </span>
                </div>

                <div className="bg-[#121e07] border border-[#FFF8B9]/20 rounded-2xl p-4">
                  <span className="text-xs text-[#FFF8B9]/70 font-semibold block">Revision Count</span>
                  <span className="text-2xl font-extrabold text-emerald-400 mt-1 block">
                    {submission?.revisionCount || 0}
                  </span>
                </div>
              </div>

              {/* Revision Timeline */}
              {submission?.revisionHistory && submission.revisionHistory.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#FFF8B9] uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span>Revision Timeline (Newest First)</span>
                  </h4>

                  <div className="space-y-2">
                    {submission.revisionHistory
                      .slice()
                      .reverse()
                      .map((entry, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between bg-[#121e07] border border-[#FFF8B9]/15 rounded-xl px-4 py-2.5 text-xs text-[#FFF8B9]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                            <span className="font-semibold">Revision iteration #{submission.revisionHistory!.length - idx}</span>
                          </div>
                          <span className="font-mono text-[#FFF8B9]/80">{formatDate(entry.revisedAt)}</span>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-[#233807]/20 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab("description")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "description"
                    ? "bg-[#233807] text-[#FFF8B9] border border-[#FFF8B9]/30 shadow-md"
                    : "text-[#233807]/80 hover:text-[#233807] hover:bg-[#233807]/10"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Description</span>
              </button>

              <button
                onClick={() => setActiveTab("solution")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "solution"
                    ? "bg-[#233807] text-[#FFF8B9] border border-[#FFF8B9]/30 shadow-md"
                    : "text-[#233807]/80 hover:text-[#233807] hover:bg-[#233807]/10"
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>Solution Code</span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "notes"
                    ? "bg-[#233807] text-[#FFF8B9] border border-[#FFF8B9]/30 shadow-md"
                    : "text-[#233807]/80 hover:text-[#233807] hover:bg-[#233807]/10"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Study Notes</span>
              </button>
            </div>

            {/* Tab Contents */}

            {/* 1. DESCRIPTION TAB */}
            {activeTab === "description" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl p-8 shadow-md space-y-6 text-[#FFF8B9]"
              >
                {problem?.description ? (
                  <div
                    className="prose prose-invert max-w-none text-[#FFF8B9] text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                  />
                ) : (
                  <p className="text-xs text-[#FFF8B9]/70 leading-relaxed">
                    Problem description is loading or not available locally. Refer to the LeetCode tab for full details.
                  </p>
                )}

                {/* Expandable Hints */}
                {problem?.hints && problem.hints.length > 0 && (
                  <div className="pt-6 border-t border-[#FFF8B9]/15 space-y-3">
                    <h3 className="text-sm font-bold text-[#FFF8B9] flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[#FFF8B9]" />
                      <span>Hints & Takeaways ({problem.hints.length})</span>
                    </h3>

                    {problem.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="bg-[#121e07] border border-[#FFF8B9]/20 rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleHint(idx)}
                          className="w-full px-5 py-3 text-left text-xs font-bold text-[#FFF8B9] flex items-center justify-between cursor-pointer hover:bg-[#FFF8B9]/10"
                        >
                          <span>Hint #{idx + 1}</span>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              expandedHints.includes(idx) ? "rotate-90 text-[#FFF8B9]" : "text-[#FFF8B9]/50"
                            }`}
                          />
                        </button>
                        {expandedHints.includes(idx) && (
                          <div className="px-5 pb-4 text-xs text-[#FFF8B9]/90 leading-relaxed border-t border-[#FFF8B9]/15 pt-3">
                            {hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. SOLUTION CODE TAB */}
            {activeTab === "solution" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl overflow-hidden shadow-md"
              >
                <div className="p-4 bg-[#121e07] border-b border-[#FFF8B9]/15 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-[#FFF8B9] text-[#233807]">
                      {submission?.language || "Code"}
                    </span>
                    <span className="text-xs text-[#FFF8B9]/70 font-semibold">
                      Submitted: {formatDate(submission?.submittedAt || null)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF8B9]/15 hover:bg-[#FFF8B9]/25 border border-[#FFF8B9]/30 text-xs font-bold text-[#FFF8B9] flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? "Copied!" : "Copy"}</span>
                    </button>

                    <button
                      onClick={handleDownloadCode}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF8B9] hover:bg-[#ffffff] text-[#233807] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-[#0b1404] font-mono text-xs text-[#fdfdfd] leading-relaxed overflow-x-auto border-t border-[#FFF8B9]/10">
                  <pre className="whitespace-pre-wrap">{submission?.solution || "// No code available"}</pre>
                </div>
              </motion.div>
            )}

            {/* 3. STUDY NOTES TAB */}
            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#233807] border border-[#FFF8B9]/20 rounded-3xl p-8 shadow-md space-y-6 text-[#FFF8B9]"
              >
                <div className="flex items-center justify-between border-b border-[#FFF8B9]/15 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#FFF8B9]">Personal Revision Notes</h3>
                    <p className="text-xs text-[#FFF8B9]/70">Write key ideas, space & time complexity, or common edge cases for interview prep.</p>
                  </div>

                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-5 py-2.5 rounded-xl bg-[#FFF8B9] hover:bg-[#ffffff] text-[#233807] font-extrabold text-xs shadow-sm cursor-pointer"
                  >
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </button>
                </div>

                <textarea
                  rows={12}
                  placeholder="Example:
• Time Complexity: O(N) using HashMap
• Space Complexity: O(N)
• Core Idea: Store complement (target - nums[i]) in hash map while iterating.
• Edge Cases: Empty array, single element, negative numbers."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full bg-[#121e07] border border-[#FFF8B9]/25 rounded-2xl p-5 text-xs text-[#FFF8B9] placeholder-[#FFF8B9]/40 focus:outline-none focus:border-[#FFF8B9] resize-none font-sans leading-relaxed"
                ></textarea>
              </motion.div>
            )}

          </>
        )}

      </main>

      {/* Reset Revision History Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233807]/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#233807] border border-[#FFF8B9]/25 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center text-[#FFF8B9]"
            >
              <div className="h-12 w-12 bg-amber-500/20 text-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
                <RotateCcw className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-[#FFF8B9]">Reset revision history?</h4>
              <p className="text-xs text-[#FFF8B9]/70 mb-4">This will remove all revision records for this problem.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-[#FFF8B9]/10 hover:bg-[#FFF8B9]/20 text-[#FFF8B9] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetRevision}
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
