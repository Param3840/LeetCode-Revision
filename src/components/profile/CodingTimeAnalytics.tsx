"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, BarChart2, Zap, Timer, Trophy, Tag, Sparkles } from "lucide-react";
import styles from "./CodingTimeAnalytics.module.css";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

interface AnalyticsData {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  totalSeconds: number;
  totalHours: number;
  avgSecondsPerProblem: number;
  longestSessionSeconds: number;
  mostSolvedTopic: string;
  mostTimeSpentTopic: string;
  dailyChart: Array<{
    date: string;
    dayLabel: string;
    minutes: number;
  }>;
}

export default function CodingTimeAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/analytics/coding-time`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.analytics) {
          setAnalytics(json.analytics);
        }
      }
    } catch (e) {
      console.error("[CodeRevise] Error loading coding time analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleRefresh = () => fetchAnalytics();
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("pageshow", handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("pageshow", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  const formatDuration = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return "0m";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.round((totalSecs % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="h-6 w-48 bg-[#FFF8B9]/15 animate-pulse rounded-md mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 bg-[#FFF8B9]/10 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const maxChartMin = Math.max(...(analytics?.dailyChart?.map((d) => d.minutes) || [1]), 60);

  return (
    <div className={styles.container}>
      {/* Title */}
      <h3 className={styles.headerTitle}>
        <Clock className="h-5 w-5 text-yellow-400" />
        <span>Coding Time Analytics</span>
      </h3>

      {/* 8 Stat Cards Grid */}
      <div className={styles.statsGrid}>
        {/* 1. Today's Coding Time */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Clock className={`${styles.cardIcon} text-amber-400`} />
          </div>
          <div className={styles.cardValue}>
            {formatDuration(analytics?.todaySeconds || 0)}
          </div>
          <div className={styles.cardLabel}>Today's Coding Time</div>
        </div>

        {/* 2. This Week */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Calendar className={`${styles.cardIcon} text-emerald-400`} />
          </div>
          <div className={styles.cardValue}>
            {formatDuration(analytics?.weekSeconds || 0)}
          </div>
          <div className={styles.cardLabel}>This Week</div>
        </div>

        {/* 3. This Month */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <BarChart2 className={`${styles.cardIcon} text-cyan-400`} />
          </div>
          <div className={styles.cardValue}>
            {formatDuration(analytics?.monthSeconds || 0)}
          </div>
          <div className={styles.cardLabel}>This Month</div>
        </div>

        {/* 4. Total Hours */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Zap className={`${styles.cardIcon} text-yellow-300`} />
          </div>
          <div className={styles.cardValue}>
            {analytics?.totalHours || 0}h
          </div>
          <div className={styles.cardLabel}>Total Coding Hours</div>
        </div>

        {/* 5. Avg Time / Problem */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Timer className={`${styles.cardIcon} text-orange-400`} />
          </div>
          <div className={styles.cardValue}>
            {formatDuration(analytics?.avgSecondsPerProblem || 0)}
          </div>
          <div className={styles.cardLabel}>Avg Time / Problem</div>
        </div>

        {/* 6. Longest Session */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Trophy className={`${styles.cardIcon} text-yellow-400`} />
          </div>
          <div className={styles.cardValue}>
            {formatDuration(analytics?.longestSessionSeconds || 0)}
          </div>
          <div className={styles.cardLabel}>Longest Session</div>
        </div>

        {/* 7. Most Time Spent Topic */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Tag className={`${styles.cardIcon} text-green-400`} />
          </div>
          <div className={`${styles.cardValue} text-sm font-bold truncate`} title={analytics?.mostTimeSpentTopic}>
            {analytics?.mostTimeSpentTopic || "N/A"}
          </div>
          <div className={styles.cardLabel}>Most Time Topic</div>
        </div>

        {/* 8. Most Solved Topic */}
        <div className={styles.statCard}>
          <div className={styles.cardHeader}>
            <Sparkles className={`${styles.cardIcon} text-purple-400`} />
          </div>
          <div className={`${styles.cardValue} text-sm font-bold truncate`} title={analytics?.mostSolvedTopic}>
            {analytics?.mostSolvedTopic || "N/A"}
          </div>
          <div className={styles.cardLabel}>Most Solved Topic</div>
        </div>
      </div>

      {/* Compact 7-Day Activity Chart */}
      <div className={styles.chartContainer}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>7-Day Coding Activity (Minutes)</span>
        </div>
        <div className={styles.barGroup}>
          {(analytics?.dailyChart || []).map((day, idx) => {
            const heightPct = day.minutes > 0 ? Math.max(10, Math.min(100, (day.minutes / maxChartMin) * 100)) : 0;
            return (
              <div key={idx} className={styles.barCol}>
                <span className={styles.barValue}>
                  {day.minutes > 0 ? `${day.minutes}m` : ""}
                </span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className={styles.barLabel}>{day.dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
