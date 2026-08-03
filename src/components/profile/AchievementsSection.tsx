"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Award, Zap, CheckCircle, Target, Shield, Crown, 
  RefreshCw, Calendar, Clock, Flame, Sparkles, Code, 
  Layers, FileText, GitBranch, Share2, Cpu, Lock, Star
} from "lucide-react";
import styles from "./AchievementsSection.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface Achievement {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  current: number;
  target: number;
  isUnlocked: boolean;
  progressPct: number;
}

interface LevelInfo {
  currentLevel: number;
  totalXP: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPct: number;
}

interface SummaryData {
  unlockedCount: number;
  totalBadges: number;
  completionPct: number;
  nextGoal: {
    title: string;
    current: number;
    target: number;
    pct: number;
  };
}

interface AchievementsResponse {
  levelInfo: LevelInfo;
  summary: SummaryData;
  achievements: Achievement[];
}

// Icon Resolver Component
const BadgeIcon = ({ iconName, isUnlocked }: { iconName: string; isUnlocked: boolean }) => {
  const iconProps = { className: "h-5 w-5" };
  switch (iconName) {
    case "Code": return <Code {...iconProps} />;
    case "Award": return <Award {...iconProps} />;
    case "Zap": return <Zap {...iconProps} />;
    case "CheckCircle": return <CheckCircle {...iconProps} />;
    case "Target": return <Target {...iconProps} />;
    case "Shield": return <Shield {...iconProps} />;
    case "Crown": return <Crown {...iconProps} />;
    case "RefreshCw": return <RefreshCw {...iconProps} />;
    case "Calendar": return <Calendar {...iconProps} />;
    case "Clock": return <Clock {...iconProps} />;
    case "Flame": return <Flame {...iconProps} />;
    case "Sparkles": return <Sparkles {...iconProps} />;
    case "Trophy": return <Trophy {...iconProps} />;
    case "Layers": return <Layers {...iconProps} />;
    case "FileText": return <FileText {...iconProps} />;
    case "GitBranch": return <GitBranch {...iconProps} />;
    case "Share2": return <Share2 {...iconProps} />;
    case "Cpu": return <Cpu {...iconProps} />;
    default: return <Star {...iconProps} />;
  }
};

export default function AchievementsSection() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/achievements`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (e) {
      console.error("[CodeRevise] Error loading achievements data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();

    const handleRefresh = () => fetchAchievements();
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("pageshow", handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("pageshow", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  const categories = ["All", "Problem Solving", "Revision", "Consistency", "Difficulty", "Topics"];

  const filteredAchievements = useMemo(() => {
    if (!data?.achievements) return [];
    if (selectedCategory === "All") return data.achievements;
    return data.achievements.filter((a) => a.category === selectedCategory);
  }, [data, selectedCategory]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="h-6 w-48 bg-[#FFF8B9]/15 animate-pulse rounded-md mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="h-28 bg-[#FFF8B9]/10 animate-pulse rounded-xl" />
          <div className="h-28 bg-[#FFF8B9]/10 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const levelInfo = data?.levelInfo || {
    currentLevel: 1,
    totalXP: 0,
    currentLevelXP: 0,
    nextLevelXP: 200,
    progressPct: 0,
  };

  const summary = data?.summary || {
    unlockedCount: 0,
    totalBadges: 0,
    completionPct: 0,
    nextGoal: { title: "First Problem Solved", current: 0, target: 1, pct: 0 },
  };

  return (
    <div className={styles.container}>
      {/* Title */}
      <h3 className={styles.headerTitle}>
        <Trophy className="h-5 w-5 text-yellow-400" />
        <span>Achievements & Levels</span>
      </h3>

      {/* Top Banner Grid: Level & XP + Summary Badges */}
      <div className={styles.topGrid}>
        {/* Card 1: Level & XP Progress */}
        <div className={styles.levelCard}>
          <div className={styles.levelHeader}>
            <div className={styles.levelBadge}>
              <Award className="h-6 w-6 text-yellow-400" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-[#FFF8B9]/70">
                  Current Rank
                </div>
                <div className={styles.levelNumber}>Level {levelInfo.currentLevel}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-yellow-300">
                {levelInfo.totalXP} XP
              </div>
              <div className={styles.xpText}>
                {levelInfo.currentLevelXP} / {levelInfo.nextLevelXP} XP
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-bold text-[#FFF8B9]/80 mb-1">
              <span>Progress to Level {levelInfo.currentLevel + 1}</span>
              <span>{levelInfo.progressPct}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${levelInfo.progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Summary Stats & Next Goal */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <div>
              <div className={styles.summaryLabel}>Unlocked Badges</div>
              <div className={styles.summaryValue}>
                {summary.unlockedCount} / {summary.totalBadges}
              </div>
            </div>
            <div className="text-right">
              <div className={styles.summaryLabel}>Completion</div>
              <div className={styles.summaryValue}>{summary.completionPct}%</div>
            </div>
          </div>

          <div className="border-t border-[#FFF8B9]/15 pt-2 mt-1">
            <div className="text-[10px] uppercase font-bold text-[#FFF8B9]/70 mb-1">
              Next Target: {summary.nextGoal.title}
            </div>
            <div className="flex items-center justify-between text-xs font-extrabold text-[#FFF8B9]">
              <span>
                {summary.nextGoal.current} / {summary.nextGoal.target}
              </span>
              <span className="text-yellow-300">{summary.nextGoal.pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className={styles.filterTabs}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`${styles.tabBtn} ${selectedCategory === cat ? styles.activeTab : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className={styles.badgeGrid}>
        {filteredAchievements.map((ach) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`${styles.badgeCard} ${
              ach.isUnlocked ? styles.unlockedBadge : styles.lockedBadge
            }`}
          >
            {/* Lock Overlay Icon if Locked */}
            {!ach.isUnlocked && (
              <div className={styles.lockOverlay}>
                <Lock className="h-4 w-4" />
              </div>
            )}

            {/* Icon Box */}
            <div
              className={`${styles.badgeIconBox} ${
                ach.isUnlocked ? styles.unlockedIconBox : ""
              }`}
            >
              <BadgeIcon iconName={ach.icon} isUnlocked={ach.isUnlocked} />
            </div>

            {/* Content */}
            <div className={styles.badgeTitle}>{ach.title}</div>
            <div className={styles.badgeDesc}>{ach.description}</div>

            {/* Progress Bar & Counter */}
            <div className="mt-auto pt-2 border-t border-[#FFF8B9]/10">
              <div className={styles.badgeProgressText}>
                <span>{ach.isUnlocked ? "Unlocked" : "Progress"}</span>
                <span>
                  {ach.current} / {ach.target}
                </span>
              </div>

              {!ach.isUnlocked && (
                <div className={styles.progressBarTrack} style={{ height: "4px" }}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${ach.progressPct}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
