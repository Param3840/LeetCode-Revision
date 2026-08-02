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
  TrendingUp
} from "lucide-react";

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

  // Active Tab: 'description' | 'solution' | 'notes' | 'revision' | 'related'
  const [activeTab, setActiveTab] = useState<"description" | "solution" | "notes" | "revision" | "related">("description");

  // Notes fields
  const [notesText, setNotesText] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedHints, setExpandedHints] = useState<number[]>([]);

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

  // Update Revision Status
  const handleUpdateStatus = async (newStatus: "New" | "Learning" | "Revising" | "Mastered") => {
    if (!submission || !submission._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setSubmission({
      ...submission,
      revisionStatus: newStatus,
      reviewCount: (submission.reviewCount || 0) + 1,
      lastReviewed: new Date().toISOString()
    });

    try {
      const res = await fetch(`${BACKEND_URL}/api/submissions/${submission._id}/revision`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ revisionStatus: newStatus })
      });
      if (res.ok) {
        showToast(`Status updated to ${newStatus}`);
      }
    } catch (e) {
      showToast("Error updating revision status");
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const difficultyClass = (diff: string) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return "bg-emerald-500/10 text-emerald-800 border-emerald-500/30";
    if (d === "medium") return "bg-amber-500/10 text-amber-800 border-amber-500/30";
    return "bg-rose-500/10 text-rose-800 border-rose-500/30";
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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-xs font-bold text-[#233807] bg-[#233807]/5 hover:bg-[#233807]/12 px-3.5 py-2 rounded-xl border border-[#233807]/15 transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/12 border border-[#233807]/15 text-xs font-bold text-[#233807] transition-all"
              >
                <span>Open on LeetCode</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            {submission?._id && (
              <button
                onClick={handleToggleFavorite}
                className="p-2 rounded-xl bg-[#233807]/5 hover:bg-[#233807]/12 border border-[#233807]/15 text-[#233807] hover:text-yellow-600 transition-colors cursor-pointer"
                title="Star Favorite"
              >
                <Star
                  className={`h-4 w-4 ${
                    submission.favorite ? "fill-yellow-500 text-yellow-500" : ""
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-[#233807]/10 rounded-xl w-1/3"></div>
            <div className="h-40 bg-[#ffffff] rounded-2xl border border-[#233807]/10"></div>
          </div>
        )}

        {/* Error Fallback */}
        {!loading && error && (
          <div className="bg-[#ffffff] border border-red-500/30 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4 shadow-sm text-[#233807]">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
            <h3 className="text-lg font-bold text-[#233807]">Problem Not Found</h3>
            <p className="text-xs text-[#233807]/70">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-[#233807] hover:bg-[#34540a] text-[#fdfdfd] font-bold text-xs cursor-pointer shadow-sm"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {!loading && (submission || problem) && (
          <>
            {/* Problem Overview Header Card */}
            <div className="bg-[#ffffff] border border-[#233807]/12 rounded-3xl p-8 shadow-sm space-y-6">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-[#233807]/5 text-[#233807] border border-[#233807]/15">
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

                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#233807] tracking-tight">
                    {submission?.title || problem?.title}
                  </h1>
                </div>

                {/* Status Selector */}
                {submission?._id && (
                  <div className="flex items-center gap-2 bg-[#233807]/5 border border-[#233807]/15 p-2 rounded-2xl">
                    <span className="text-xs text-[#233807]/70 font-semibold px-2">Revision Status:</span>
                    <select
                      value={submission.revisionStatus || "New"}
                      onChange={(e) => handleUpdateStatus(e.target.value as any)}
                      className="bg-[#ffffff] border border-[#233807]/20 text-[#233807] font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Learning">Learning</option>
                      <option value="Revising">Revising</option>
                      <option value="Mastered">Mastered</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Tags & Company Pills */}
              <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-[#233807]/10">
                {/* Topic Tags */}
                {(problem?.tags || submission?.tags)?.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-medium text-[#233807] bg-[#233807]/5 border border-[#233807]/12 px-3 py-1 rounded-xl"
                  >
                    {t}
                  </span>
                ))}

                {/* Companies */}
                {problem?.companies && problem.companies.length > 0 && (
                  <div className="flex items-center gap-2 border-l border-[#233807]/15 pl-4">
                    <Building2 className="h-4 w-4 text-[#233807]" />
                    {problem.companies.map((c) => (
                      <span
                        key={c}
                        className="text-[11px] font-bold text-[#233807] bg-[#233807]/8 border border-[#233807]/20 px-2.5 py-0.5 rounded-lg"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-2 border-b border-[#233807]/12 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab("description")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "description"
                    ? "bg-[#233807] text-[#fdfdfd] shadow-md"
                    : "text-[#233807]/70 hover:text-[#233807] hover:bg-[#233807]/5"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Description</span>
              </button>

              <button
                onClick={() => setActiveTab("solution")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "solution"
                    ? "bg-[#233807] text-[#fdfdfd] shadow-md"
                    : "text-[#233807]/70 hover:text-[#233807] hover:bg-[#233807]/5"
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span>Solution Code</span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "notes"
                    ? "bg-[#233807] text-[#fdfdfd] shadow-md"
                    : "text-[#233807]/70 hover:text-[#233807] hover:bg-[#233807]/5"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => setActiveTab("revision")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "revision"
                    ? "bg-[#233807] text-[#fdfdfd] shadow-md"
                    : "text-[#233807]/70 hover:text-[#233807] hover:bg-[#233807]/5"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Revision Timeline</span>
              </button>

              {problem?.relatedProblems && problem.relatedProblems.length > 0 && (
                <button
                  onClick={() => setActiveTab("related")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "related"
                      ? "bg-[#233807] text-[#fdfdfd] shadow-md"
                      : "text-[#233807]/70 hover:text-[#233807] hover:bg-[#233807]/5"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Related ({problem.relatedProblems.length})</span>
                </button>
              )}
            </div>

            {/* Tab Contents */}

            {/* 1. DESCRIPTION TAB */}
            {activeTab === "description" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#ffffff] border border-[#233807]/12 rounded-3xl p-8 shadow-sm space-y-6 text-[#233807]"
              >
                {problem?.description ? (
                  <div
                    className="prose prose-[#233807] max-w-none text-[#233807] text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: problem.description }}
                  />
                ) : (
                  <p className="text-xs text-[#233807]/70 leading-relaxed">
                    Problem description is loading or not available locally. Refer to the LeetCode tab for full details.
                  </p>
                )}

                {/* Expandable Hints */}
                {problem?.hints && problem.hints.length > 0 && (
                  <div className="pt-6 border-t border-[#233807]/10 space-y-3">
                    <h3 className="text-sm font-bold text-[#233807] flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-[#233807]" />
                      <span>Hints & Takeaways ({problem.hints.length})</span>
                    </h3>

                    {problem.hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="bg-[#233807]/5 border border-[#233807]/12 rounded-2xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleHint(idx)}
                          className="w-full px-5 py-3 text-left text-xs font-bold text-[#233807] flex items-center justify-between cursor-pointer hover:bg-[#233807]/8"
                        >
                          <span>Hint #{idx + 1}</span>
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              expandedHints.includes(idx) ? "rotate-90 text-[#233807]" : "text-[#233807]/50"
                            }`}
                          />
                        </button>
                        {expandedHints.includes(idx) && (
                          <div className="px-5 pb-4 text-xs text-[#233807]/90 leading-relaxed border-t border-[#233807]/10 pt-3">
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
                className="bg-[#ffffff] border border-[#233807]/12 rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="p-4 bg-[#233807]/5 border-b border-[#233807]/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#233807] text-[#fdfdfd]">
                      {submission?.language || "Code"}
                    </span>
                    <span className="text-xs text-[#233807]/70 font-semibold">
                      Submitted: {formatDate(submission?.submittedAt || null)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-xl bg-[#ffffff] hover:bg-[#233807]/10 border border-[#233807]/20 text-xs font-bold text-[#233807] flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCode ? "Copied!" : "Copy"}</span>
                    </button>

                    <button
                      onClick={handleDownloadCode}
                      className="px-3 py-1.5 rounded-xl bg-[#233807] hover:bg-[#34540a] text-[#fdfdfd] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-[#182605] font-mono text-xs text-[#fdfdfd] leading-relaxed overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{submission?.solution || "// No code available"}</pre>
                </div>
              </motion.div>
            )}

            {/* 3. STUDY NOTES TAB */}
            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#ffffff] border border-[#233807]/12 rounded-3xl p-8 shadow-sm space-y-6 text-[#233807]"
              >
                <div className="flex items-center justify-between border-b border-[#233807]/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#233807]">Personal Revision Notes</h3>
                    <p className="text-xs text-[#233807]/70">Write key ideas, space & time complexity, or common edge cases for interview prep.</p>
                  </div>

                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-5 py-2.5 rounded-xl bg-[#233807] hover:bg-[#34540a] text-[#fdfdfd] font-bold text-xs shadow-sm cursor-pointer"
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
                  className="w-full bg-[#ffffff] border border-[#233807]/20 rounded-2xl p-5 text-xs text-[#233807] placeholder-[#233807]/40 focus:outline-none focus:border-[#233807] resize-none font-sans leading-relaxed"
                ></textarea>
              </motion.div>
            )}

            {/* 4. REVISION TIMELINE TAB */}
            {activeTab === "revision" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#ffffff] border border-[#233807]/12 rounded-3xl p-8 shadow-sm space-y-8 text-[#233807]"
              >
                <h3 className="text-base font-bold text-[#233807]">Revision History & Progress</h3>

                {/* Progress Steps */}
                <div className="grid grid-cols-4 gap-4">
                  {["New", "Learning", "Revising", "Mastered"].map((st, idx) => {
                    const isActive = submission?.revisionStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st as any)}
                        className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#233807] border-[#233807] text-[#fdfdfd] font-extrabold shadow-sm"
                            : "bg-[#233807]/5 border-[#233807]/15 text-[#233807] hover:bg-[#233807]/10"
                        }`}
                      >
                        <span className="text-[10px] block opacity-70">Step {idx + 1}</span>
                        <span className="text-sm">{st}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Statistics Table */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#233807]/10">
                  <div className="bg-[#233807]/5 border border-[#233807]/12 rounded-2xl p-4">
                    <span className="text-xs text-[#233807]/70 font-semibold block">First Solved</span>
                    <span className="text-sm font-bold text-[#233807] mt-1 block">
                      {formatDate(submission?.submittedAt || null)}
                    </span>
                  </div>

                  <div className="bg-[#233807]/5 border border-[#233807]/12 rounded-2xl p-4">
                    <span className="text-xs text-[#233807]/70 font-semibold block">Total Reviews</span>
                    <span className="text-xl font-extrabold text-[#233807] mt-1 block">
                      {submission?.reviewCount || 0} times
                    </span>
                  </div>

                  <div className="bg-[#233807]/5 border border-[#233807]/12 rounded-2xl p-4">
                    <span className="text-xs text-[#233807]/70 font-semibold block">Last Reviewed</span>
                    <span className="text-sm font-bold text-[#233807] mt-1 block">
                      {formatDate(submission?.lastReviewed || null)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. RELATED PROBLEMS TAB */}
            {activeTab === "related" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {problem?.relatedProblems.map((rel) => (
                  <div
                    key={rel.slug || rel.problemNumber}
                    onClick={() => router.push(`/problems/${rel.problemNumber || rel.slug}`)}
                    className="bg-[#ffffff] border border-[#233807]/12 hover:border-[#233807]/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-3 text-[#233807]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#233807]/5 text-[#233807]">
                        #{rel.problemNumber || "N/A"}
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#233807]/8 text-[#233807] border border-[#233807]/20">
                        {rel.difficulty}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#233807] group-hover:text-[#34540a] transition-colors">
                      {rel.title}
                    </h4>
                  </div>
                ))}
              </motion.div>
            )}

          </>
        )}

      </main>

    </div>
  );
}
