"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Calendar, Zap, Star, Activity } from "lucide-react";
import styles from "./RevisionHeatmap.module.css";
import { API_URL } from "@/lib/api";

const BACKEND_URL = API_URL;

interface HeatmapDay {
  date: string;
  revisedCount: number;
  masteredCount: number;
  reviewActionsCount: number;
  totalCount: number;
  level: number;
}

interface SummaryData {
  currentStreak: number;
  longestStreak: number;
  totalRevisionDays: number;
  totalReviews: number;
  masteredProblems: number;
}

interface TooltipState {
  day: HeatmapDay;
  x: number;
  y: number;
}

const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
};

export default function RevisionHeatmap() {
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    currentStreak: 0,
    longestStreak: 0,
    totalRevisionDays: 0,
    totalReviews: 0,
    masteredProblems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const fetchHeatmapData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/submissions/heatmap`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      console.log("[CodeRevise Debug] 1. Heatmap API Response status:", res.status);

      if (res.ok) {
        const json = await res.json();
        console.log("[CodeRevise Debug] 2. Parsed Data:", json);
        if (json.success) {
          console.log("[CodeRevise Debug] 3. Setting Days:", json.days?.length, "Setting Summary:", json.summary);
          setDays(json.days || []);
          setSummary(json.summary || {
            currentStreak: 0,
            longestStreak: 0,
            totalRevisionDays: 0,
            totalReviews: 0,
            masteredProblems: 0,
          });
        } else {
          console.warn("[CodeRevise Debug] API returned success: false");
        }
      } else {
        console.error("[CodeRevise Debug] API request failed with status:", res.status);
      }
    } catch (e) {
      console.error("[CodeRevise Debug] Error loading heatmap data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();

    // Re-fetch when page regains focus, is displayed, or storage updates
    const handleRefresh = () => fetchHeatmapData();
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("pageshow", handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("pageshow", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, []);

  // Organize 365 days into calendar-accurate weeks (columns of 7 rows: 0=Sun..6=Sat)
  const { weeks, monthLabels } = useMemo(() => {
    if (!days.length) return { weeks: [], monthLabels: [] };

    // 1. Build a quick lookup map of "YYYY-MM-DD" -> HeatmapDay
    const daysMap = new Map<string, HeatmapDay>();
    days.forEach((day) => {
      if (day.date) {
        daysMap.set(day.date, day);
      }
    });

    // 2. Identify the target date range (365 days leading up to today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    // 3. Find the Sunday on or before startDate to align week column index 0 = Sunday
    const gridStartDate = new Date(startDate);
    gridStartDate.setDate(gridStartDate.getDate() - gridStartDate.getDay()); // Rewind to Sunday

    const weekCols: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = new Array(7);

    const currentDate = new Date(gridStartDate);

    while (currentDate <= today) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      if (currentDate < startDate) {
        // Padded empty day before the 365-day window
        currentWeek[dayOfWeek] = {
          date: "",
          revisedCount: 0,
          masteredCount: 0,
          reviewActionsCount: 0,
          totalCount: 0,
          level: -1,
        };
      } else {
        const dayData = daysMap.get(dateStr) || {
          date: dateStr,
          revisedCount: 0,
          masteredCount: 0,
          reviewActionsCount: 0,
          totalCount: 0,
          level: 0,
        };
        // Explicitly place at currentDate.getDay() row!
        currentWeek[dayOfWeek] = dayData;
      }

      // When week reaches Saturday (dayOfWeek === 6), push week column and start next
      if (dayOfWeek === 6) {
        weekCols.push(currentWeek);
        currentWeek = new Array(7);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push partial final week if not empty
    if (currentWeek.some((d) => d !== undefined)) {
      for (let i = 0; i < 7; i++) {
        if (!currentWeek[i]) {
          currentWeek[i] = {
            date: "",
            revisedCount: 0,
            masteredCount: 0,
            reviewActionsCount: 0,
            totalCount: 0,
            level: -1,
          };
        }
      }
      weekCols.push(currentWeek);
    }

    // 4. Calculate Month Labels according to actual calendar months
    const months: { name: string; index: number }[] = [];
    let lastMonth = -1;

    weekCols.forEach((week, wIndex) => {
      const firstValidDay = week.find((d) => d && d.date);
      if (firstValidDay) {
        const dObj = parseLocalDate(firstValidDay.date);
        const m = dObj.getMonth();
        if (m !== lastMonth) {
          months.push({
            name: dObj.toLocaleString("en-US", { month: "short" }),
            index: wIndex,
          });
          lastMonth = m;
        }
      }
    });

    return { weeks: weekCols, monthLabels: months };
  }, [days]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getLevelClass = (level: number) => {
    if (level === 1) return styles.level1;
    if (level === 2) return styles.level2;
    if (level === 3) return styles.level3;
    if (level === 4) return styles.level4;
    return styles.level0;
  };

  console.log("[CodeRevise Debug] 4. Rendering Heatmap -> loading:", loading, "summary:", summary, "daysCount:", days.length);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="h-6 w-48 bg-[#FFF8B9]/15 animate-pulse rounded-md mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-[#FFF8B9]/10 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-32 bg-[#FFF8B9]/10 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Title */}
      <h3 className={styles.headerTitle}>
        <Activity className="h-5 w-5 text-orange-400" />
        <span>Revision Activity Heatmap</span>
      </h3>

      {/* Summary Stat Badges */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-400 fill-orange-400" />
            <span className={styles.summaryValue}>{summary.currentStreak}d</span>
          </div>
          <span className={styles.summaryLabel}>Current Streak</span>
        </div>

        <div className={styles.summaryCard}>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className={styles.summaryValue}>{summary.longestStreak}d</span>
          </div>
          <span className={styles.summaryLabel}>Longest Streak</span>
        </div>

        <div className={styles.summaryCard}>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-green-400" />
            <span className={styles.summaryValue}>{summary.totalRevisionDays}</span>
          </div>
          <span className={styles.summaryLabel}>Revision Days</span>
        </div>
      </div>

      {/* Main Heatmap Grid */}
      <div className={styles.scrollWrapper}>
        <div className={styles.heatmapGridWrapper}>
          {/* Months Header Row */}
          <div className={styles.monthRow}>
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className={styles.monthLabel}
                style={{ left: `${m.index * 15}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Grid Body */}
          <div className={styles.gridBody}>
            {/* Weekdays Left Labels */}
            <div className={styles.weekdayColumn}>
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>

            {/* Weeks Columns */}
            <div className={styles.columnsContainer}>
              {weeks.map((week, wIndex) => (
                <motion.div
                  key={wIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: wIndex * 0.008, duration: 0.2 }}
                  className={styles.weekColumn}
                >
                  {week.map((day, dIndex) => {
                    if (day.level === -1) {
                      return (
                        <div
                          key={dIndex}
                          className="w-[12px] h-[12px] opacity-0"
                        />
                      );
                    }

                    return (
                      <div
                        key={dIndex}
                        className={`${styles.daySquare} ${getLevelClass(day.level)}`}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            day,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 10,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State message if user has 0 activity */}
      {summary.totalRevisionDays === 0 && (
        <div className={styles.emptyState}>
          Start revising problems to build your activity history.
        </div>
      )}

      {/* Legend Footer */}
      <div className={styles.legendFooter}>
        <span>365 Days of CodeRevise Activity</span>
        <div className={styles.legendScale}>
          <span className="text-[10px]">Less</span>
          <div className="w-[12px] h-[12px] rounded-[2px] bg-rgba(255,248,185,0.08) border border-[#FFF8B9]/10" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[#8ba848]" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[#568203]" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[#34540a] border border-[#FFF8B9]/30" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[#d9c44e] shadow-[0_0_6px_rgba(217,196,78,0.6)]" />
          <span className="text-[10px]">More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip Portal */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[99999] pointer-events-none -translate-x-1/2 -translate-y-full bg-[#1a2905] text-[#FFF8B9] border border-[#FFF8B9]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans whitespace-nowrap min-w-[160px]"
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          >
            <div className="font-bold text-xs border-b border-[#FFF8B9]/20 pb-1 mb-1 text-[#FFF8B9]">
              {formatDate(tooltip.day.date)}
            </div>
            {tooltip.day.revisedCount > 0 ? (
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <span className="text-[#FFF8B9]/80 font-medium">📚 Revised Problems</span>
                <span className="font-extrabold text-[#FFF8B9] text-xs">
                  {tooltip.day.revisedCount}
                </span>
              </div>
            ) : (
              <div className="text-[#FFF8B9]/60 font-medium text-[11px] pt-0.5">
                No revisions on this day.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
