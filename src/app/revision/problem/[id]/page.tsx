"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Sparkles, ExternalLink, Copy, Code, HelpCircle, Clock, BookOpen, AlertCircle, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getRepoCache, getCurrentRepoUrl, getRevisedProblems, markProblemRevision } from "@/lib/storage";
import { getProblemMetadata } from "@/lib/problems";
import { fetchSolutionCode, fetchReadmeContent, SolvedProblem } from "@/lib/github";
import styles from "./page.module.css";

function parseReadmeToHtml(text: string): string {
  if (!text) return "";
  
  // If it's already HTML (contains <h2> or <p> tags), return it directly
  if (text.includes("<h2") || text.includes("<p>") || text.includes("<h3>")) {
    return text.replace(/<a href=/g, '<a target="_blank" rel="noopener noreferrer" href=');
  }

  // Basic markdown parser fallback
  let html = text;
  html = html.replace(/^### (.*$)/gim, '<h4 style="font-weight:700;margin-top:1rem;margin-bottom:0.5rem;color:#233807;">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 style="font-weight:700;margin-top:1.25rem;margin-bottom:0.5rem;color:#233807;">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 style="font-weight:700;margin-top:1.5rem;margin-bottom:0.5rem;color:#233807;">$1</h2>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`(.*?)`/g, '<code style="background-color:rgba(35,56,7,0.06);padding:0.125rem 0.25rem;border-radius:0.25rem;font-family:monospace;font-size:0.875em;">$1</code>');
  html = html.split("\n").join("<br />");

  return html;
}

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = parseInt(params.id as string, 10);

  // 1. Loading & State
  const [repoDetails, setRepoDetails] = useState<any>(null);
  const [problem, setProblem] = useState<SolvedProblem | null>(null);
  const [revisedIds, setRevisedIds] = useState<number[]>([]);
  const [activeSolutionIdx, setActiveSolutionIdx] = useState(0);
  const [code, setCode] = useState<string>("");
  const [loadingCode, setLoadingCode] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [readme, setReadme] = useState<string | null>(null);
  const [loadingReadme, setLoadingReadme] = useState(false);

  // 2. Fetch repo details from localStorage
  useEffect(() => {
    const currentUrl = getCurrentRepoUrl();
    if (!currentUrl) {
      router.replace("/");
      return;
    }

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

    // Find the current problem in the solved list
    const foundProblem = cachedData.problems.find((p: any) => p.id === problemId);
    if (foundProblem) {
      setProblem(foundProblem);
    }
  }, [problemId, router]);

  // 3. On-demand fetch of the active solution file content
  useEffect(() => {
    if (!repoDetails || !problem || problem.solutions.length === 0) return;

    setIsSolutionRevealed(false);
    setShowHints(false);
    const activeSolution = problem.solutions[activeSolutionIdx];
    setLoadingCode(true);
    setCodeError(null);

    fetchSolutionCode(repoDetails.owner, repoDetails.repo, repoDetails.defaultBranch, activeSolution.path)
      .then((data) => {
        setCode(data);
        setLoadingCode(false);
      })
      .catch((err) => {
        console.error(err);
        setCodeError("Failed to fetch solution code from GitHub. Please check your connection.");
        setLoadingCode(false);
      });
  }, [repoDetails, problem, activeSolutionIdx]);

  // Fetch README.md when problem changes
  useEffect(() => {
    if (!repoDetails || !problem || problem.solutions.length === 0) return;

    setLoadingReadme(true);
    setReadme(null);
    const activeSolution = problem.solutions[0];

    fetchReadmeContent(repoDetails.owner, repoDetails.repo, repoDetails.defaultBranch, activeSolution.path)
      .then((data) => {
        setReadme(data);
        setLoadingReadme(false);
      })
      .catch((err) => {
        console.error(err);
        setReadme(null);
        setLoadingReadme(false);
      });
  }, [repoDetails, problem]);

  // Toggle revised state
  const handleToggleRevision = () => {
    if (!repoDetails || !problem) return;
    const isCurrentlyRevised = revisedIds.includes(problemId);
    const updated = markProblemRevision(repoDetails.owner, repoDetails.repo, problemId, !isCurrentlyRevised);
    setRevisedIds(updated);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Retrieve problem details from metadata layer
  const metadata = useMemo(() => {
    if (!problem) return null;
    return getProblemMetadata(problem.id, problem.slug);
  }, [problem]);

  const isRevised = revisedIds.includes(problemId);

  // Return to dashboard
  const handleBackToDashboard = () => {
    router.back();
  };

  // Error state: problem not found in repo solved list
  if (repoDetails && !problem) {
    return (
      <>
        <Navbar />
        <main className={styles.main} style={{ justifyContent: "center", alignItems: "center" }}>
          <div className={styles.card} style={{ maxWidth: "28rem", textAlign: "center" }}>
            <AlertCircle className={styles.fallbackIcon} style={{ color: "#b91c1c", width: "3rem", height: "3rem", marginBottom: "1rem" }} />
            <h3 className={styles.fallbackTitle}>Problem not found</h3>
            <p className={styles.fallbackText}>
              Problem #{problemId} was not detected as solved in repository: {repoDetails.owner}/{repoDetails.repo}.
            </p>
            <button
              onClick={() => router.push("/revision/dashboard")}
              className={styles.actionButton}
              style={{ marginTop: "1.5rem", display: "inline-flex" }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Loading indicator for repo parsing
  if (!repoDetails || !problem || !metadata) {
    return (
      <div className={styles.loaderWrapper}>
        <div className={styles.loaderContent}>
          <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin" />
          <span>Loading revision guide...</span>
        </div>
      </div>
    );
  }

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
    <>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Back Navigation & Buttons */}
          <div className={styles.topBar}>
            <button
              onClick={handleBackToDashboard}
              className={styles.backButton}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Solved Questions</span>
            </button>

            <div className={styles.actionGroup}>
              {/* LeetCode link */}
              <a
                href={`https://leetcode.com/problems/${problem.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionButton}
              >
                <span>Open on LeetCode</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {/* Revision toggle status */}
              <button
                onClick={handleToggleRevision}
                className={`${styles.revisionToggle} ${
                  isRevised ? styles.revisionToggleActive : ""
                }`}
              >
                {isRevised ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Revised</span>
                  </>
                ) : (
                  <span>Mark Revised</span>
                )}
              </button>
            </div>
          </div>

          {/* Problem Header Information */}
          <div className={styles.problemHeader}>
            <div className={styles.headerTitleGroup}>
              <span className={styles.problemNumber}>
                #{problem.id.toString().padStart(4, "0")}
              </span>
              <h1 className={styles.problemTitle}>
                {problem.title}
              </h1>
            </div>

            <div className={styles.tagsRow}>
              <span className={`${styles.difficultyBadge} ${getDifficultyStyles(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
              {problem.topics.map((t) => (
                <span
                  key={t}
                  className={styles.topicBadge}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Focused Split Layout */}
          <div className={styles.splitLayout}>
            {/* LEFT Column: Quick Revision Explanation (40% width) */}
            <div className={styles.leftColumn}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <Sparkles className={styles.headerIcon} />
                  <h2 className={styles.cardTitle}>Quick Revision Guide</h2>
                </div>

                {metadata.quickRevision ? (
                  <div className={styles.contentList}>
                    {/* Description */}
                    <div>
                      <h4 className={styles.sectionTitle}>
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Description</span>
                      </h4>
                      <p className={styles.bodyText} style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>
                        {metadata.quickRevision.description}
                      </p>
                    </div>

                    {/* Example */}
                    <div className={styles.exampleBox}>
                      <h4 className={styles.exampleLabel}>Example</h4>
                      <code className={styles.exampleCode} style={{ whiteSpace: "pre-wrap", display: "block" }}>
                        {metadata.quickRevision.example}
                      </code>
                    </div>

                    {/* Hint Toggle Button */}
                    <button
                      onClick={() => setShowHints(!showHints)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "0.75rem",
                        border: "1px solid rgba(86, 130, 3, 0.2)",
                        backgroundColor: showHints ? "rgba(86, 130, 3, 0.06)" : "rgba(255, 255, 255, 0.6)",
                        color: "#568203",
                        fontWeight: "700",
                        fontSize: "0.825rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        marginTop: "0.5rem",
                        marginBottom: "0.5rem",
                        boxShadow: "0 2px 8px rgba(135, 122, 53, 0.02)"
                      }}
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>{showHints ? "Hide Revision Hints" : "Reveal Revision Hints"}</span>
                    </button>

                    {showHints && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingTop: "0.5rem" }}>
                        {/* Core Idea */}
                        <div>
                          <h4 className={styles.sectionTitle}>
                            <HelpCircle className="h-3.5 w-3.5" />
                            <span>Core Idea</span>
                          </h4>
                          <p className={styles.bodyText} style={{ marginTop: "0.5rem" }}>
                            {metadata.quickRevision.coreIdea}
                          </p>
                        </div>

                        {/* Important Observation */}
                        <div className={styles.observationBox}>
                          <h4 className={styles.observationLabel}>Key Observation</h4>
                          <p className={styles.observationText}>{metadata.quickRevision.observation}</p>
                        </div>

                        {/* Common Approaches */}
                        <div>
                          <h4 className={styles.sectionTitle}>Approaches</h4>
                          <ul className={styles.approachList} style={{ marginTop: "0.5rem" }}>
                            {metadata.quickRevision.approaches.map((app, idx) => (
                              <li key={idx} className={styles.approachItem}>{app}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Complexities */}
                        <div className={styles.complexityGrid}>
                          <div>
                            <h4 className={styles.complexityLabel}>
                              <Clock className="h-3.5 w-3.5" />
                              <span>Time Complexity</span>
                            </h4>
                            <span className={styles.complexityText}>
                              {metadata.quickRevision.timeComplexity}
                            </span>
                          </div>
                          <div>
                            <h4 className={styles.complexityLabel}>
                              <Code className="h-3.5 w-3.5" />
                              <span>Space Complexity</span>
                            </h4>
                            <span className={styles.complexityText}>
                              {metadata.quickRevision.spaceComplexity}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : loadingReadme ? (
                  <div className={styles.fallbackWrapper} style={{ padding: "4rem 2rem" }}>
                    <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mb-3" />
                    <p className={styles.fallbackText}>Fetching question details from GitHub repository...</p>
                  </div>
                ) : readme ? (
                  <div className={styles.contentList} style={{ padding: "0.5rem" }}>
                    <div 
                      className={styles.bodyText} 
                      style={{ 
                        marginTop: "0.5rem", 
                        lineHeight: "1.6",
                        fontSize: "0.875rem",
                        color: "#233807"
                      }}
                      dangerouslySetInnerHTML={{ __html: parseReadmeToHtml(readme) }}
                    />
                  </div>
                ) : (
                  // Fallback state if quick revision guide is not preloaded and README is missing
                  <div className={styles.fallbackWrapper}>
                    <div className={styles.fallbackIconWrapper}>
                      <HelpCircle className={styles.fallbackIcon} />
                    </div>
                    <h4 className={styles.fallbackTitle}>No revision guide</h4>
                    <p className={styles.fallbackText}>
                      Detailed revision notes for problem #{problemId} could not be retrieved from GitHub or local database.
                    </p>
                    <a
                      href={`https://leetcode.com/problems/${problem.slug}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionButton}
                      style={{ marginTop: "1.25rem", display: "inline-flex" }}
                    >
                      <span>Study on LeetCode</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT Column: Solution Code Viewer (60% width) */}
            <div className={styles.rightColumn}>
              <div className={styles.card} style={{ padding: 0 }}>
                {/* Switcher & File Metadata */}
                <div 
                  className={styles.cardHeader} 
                  style={{ 
                    margin: 0, 
                    padding: "1rem 1.25rem", 
                    borderBottom: "1px solid var(--color-card-border)", 
                    borderTopLeftRadius: "inherit", 
                    borderTopRightRadius: "inherit", 
                    backgroundColor: "rgba(255, 248, 185, 0.2)",
                    justifyContent: "space-between" 
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Code className={styles.headerIcon} />
                    <span className={styles.cardTitle}>
                      My Solutions ({problem.solutions.length})
                    </span>
                  </div>

                  {/* Multi-language selector tabs */}
                  {problem.solutions.length > 1 && (
                    <div className={styles.tabBar} style={{ border: 0, margin: 0 }}>
                      {problem.solutions.map((sol, index) => (
                        <button
                          key={sol.path}
                          onClick={() => setActiveSolutionIdx(index)}
                          className={`${styles.tabButton} ${
                            activeSolutionIdx === index ? styles.tabButtonActive : ""
                          }`}
                          style={{ padding: "0.25rem 0.5rem" }}
                        >
                          {sol.language}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Code Container */}
                <div className={styles.codeAreaWrapper} style={{ display: "flex", flexDirection: "column" }}>
                  {!isSolutionRevealed ? (
                    <div style={{ padding: "1.5rem" }}>
                      <button
                        onClick={() => setIsSolutionRevealed(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          width: "100%",
                          padding: "0.75rem",
                          borderRadius: "0.75rem",
                          border: "1px solid rgba(86, 130, 3, 0.2)",
                          backgroundColor: "rgba(255, 255, 255, 0.6)",
                          color: "#568203",
                          fontWeight: "700",
                          fontSize: "0.825rem",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 8px rgba(135, 122, 53, 0.02)"
                        }}
                      >
                        <Code className="h-4 w-4" />
                        <span>Reveal Solution</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                      {loadingCode ? (
                        <div className={styles.codeAreaLoader}>
                          <div className={styles.codeAreaLoaderContent}>
                            <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin" />
                            <span>Loading solution from GitHub...</span>
                          </div>
                        </div>
                      ) : codeError ? (
                        <div className={styles.codeAreaLoader} style={{ flexDirection: "column", height: "auto", padding: "3rem" }}>
                          <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
                          <h4 className={styles.fallbackTitle}>Failed to load code</h4>
                          <p className={styles.fallbackText}>{codeError}</p>
                          <button
                            onClick={() => setActiveSolutionIdx(activeSolutionIdx)} // Trigger refetch
                            className={styles.actionButton}
                            style={{ marginTop: "1rem" }}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Retry Fetch</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col relative">
                          {/* Actions bar inside Viewer */}
                          <div 
                            className={styles.cardHeader} 
                            style={{ 
                              margin: 0, 
                              padding: "0.625rem 1.25rem",
                              borderBottom: "1px solid var(--color-card-border)",
                              justifyContent: "space-between" 
                            }}
                          >
                            <span className={styles.exampleLabel} style={{ textTransform: "none", margin: 0 }}>
                              {problem.solutions[activeSolutionIdx].filename}
                            </span>
                            
                            <div className={styles.actionGroup} style={{ gap: "1rem" }}>
                              <button
                                onClick={handleCopyCode}
                                className={styles.backButton}
                                style={{ gap: "0.25rem", fontSize: "10px" }}
                                title="Copy code to clipboard"
                              >
                                {copied ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={`https://github.com/${repoDetails.owner}/${repoDetails.repo}/blob/${repoDetails.defaultBranch}/${problem.solutions[activeSolutionIdx].path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.backButton}
                                style={{ gap: "0.25rem", fontSize: "10px", textDecoration: "none" }}
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>View on GitHub</span>
                              </a>
                            </div>
                          </div>

                          {/* Monospace Code block */}
                          <pre className={styles.codePre}>
                            <code className={styles.codeText}>
                              {code}
                            </code>
                          </pre>

                          {/* Floating Copy Button */}
                          <button
                            onClick={handleCopyCode}
                            className={`${styles.copyCodeButton} ${copied ? styles.copyCodeButtonActive : ""}`}
                            title="Copy code"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          {copied && <div className={styles.copyTooltip}>Copied!</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
