const Submission = require('../models/Submission');

// Helper to format Date into YYYY-MM-DD local calendar string
const toLocalDayString = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Update user streak (kept for backward compatibility with markRevised controller)
const updateUserStreak = async (userId, revisionDate = new Date()) => {
  return await getStreakStats(userId);
};

// Get streak statistics for a user from Submission records (SINGLE SOURCE OF TRUTH)
const getStreakStats = async (userId) => {
  const submissions = await Submission.find({ userId });

  const activeDatesSet = new Set();
  let totalRevisionsCount = 0;

  submissions.forEach(sub => {
    // 1. Process explicit revisionHistory array entries
    if (Array.isArray(sub.revisionHistory) && sub.revisionHistory.length > 0) {
      sub.revisionHistory.forEach(entry => {
        if (entry && (entry.revisedAt || entry.createdAt)) {
          const dateStr = toLocalDayString(entry.revisedAt || entry.createdAt);
          if (dateStr) {
            activeDatesSet.add(dateStr);
            totalRevisionsCount += 1;
          }
        }
      });
    }

    // 2. Process isRevised / revisionCount fallback
    if (sub.isRevised || (sub.revisionCount && sub.revisionCount > 0)) {
      const revisedDate = sub.lastRevisionDate || sub.updatedAt || sub.submittedAt;
      if (revisedDate) {
        const dateStr = toLocalDayString(revisedDate);
        if (dateStr) {
          activeDatesSet.add(dateStr);
        }
      }
    }
  });

  const activeDaysCount = activeDatesSet.size;
  const sortedActiveDates = Array.from(activeDatesSet).sort();

  let longestStreak = 0;
  let tempStreak = 0;
  let prevTimestamp = null;

  sortedActiveDates.forEach(dateStr => {
    const currentTimestamp = new Date(dateStr).getTime();
    if (prevTimestamp === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currentTimestamp - prevTimestamp) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevTimestamp = currentTimestamp;
  });

  let currentStreak = 0;
  const todayStr = toLocalDayString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = toLocalDayString(yesterdayDate);

  const hasToday = activeDatesSet.has(todayStr);
  const hasYesterday = activeDatesSet.has(yesterdayStr);

  if (hasToday || hasYesterday) {
    let checkDate = hasToday ? new Date() : yesterdayDate;
    while (true) {
      const checkStr = toLocalDayString(checkDate);
      if (activeDatesSet.has(checkStr)) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalRevisionDays: activeDaysCount,
    totalRevisions: totalRevisionsCount
  };
};

module.exports = {
  updateUserStreak,
  getStreakStats
};
