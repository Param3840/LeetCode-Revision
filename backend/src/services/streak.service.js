const UserRevisionStats = require('../models/UserRevisionStats');

// Convert Date to YYYY-MM-DD string in UTC
const toDayString = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  return dateObj.toISOString().split('T')[0];
};

// Calculate difference in calendar days between two dates
const getCalendarDayDiff = (d1, d2) => {
  if (!d1 || !d2) return Infinity;
  const day1Str = toDayString(d1);
  const day2Str = toDayString(d2);
  if (!day1Str || !day2Str) return Infinity;
  
  const day1 = new Date(day1Str);
  const day2 = new Date(day2Str);
  const diffMs = day1.getTime() - day2.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

// Update user streak when a problem revision is marked
const updateUserStreak = async (userId, revisionDate = new Date()) => {
  let stats = await UserRevisionStats.findOne({ userId });

  if (!stats) {
    stats = new UserRevisionStats({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastRevisionDate: revisionDate,
      totalRevisionDays: 1,
      totalRevisions: 1
    });
    await stats.save();
    return stats;
  }

  // Always increment total revisions count
  stats.totalRevisions += 1;

  const dayDiff = getCalendarDayDiff(revisionDate, stats.lastRevisionDate);

  if (dayDiff === 0) {
    // Same calendar day: do NOT double-increment streak or totalRevisionDays
  } else if (dayDiff === 1) {
    // Next consecutive calendar day: increment streak
    stats.currentStreak += 1;
    stats.totalRevisionDays += 1;
    stats.lastRevisionDate = revisionDate;
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
  } else {
    // Skipped 1 or more days (dayDiff > 1): reset current streak to 1
    stats.currentStreak = 1;
    stats.totalRevisionDays += 1;
    stats.lastRevisionDate = revisionDate;
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }
  }

  await stats.save();
  return stats;
};

// Get streak statistics for a user (with inactivity reset check)
const getStreakStats = async (userId) => {
  let stats = await UserRevisionStats.findOne({ userId });

  if (!stats) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastRevisionDate: null,
      totalRevisionDays: 0,
      totalRevisions: 0
    };
  }

  // If user skipped yesterday (> 1 day since last revision), reset currentStreak to 0
  const now = new Date();
  const dayDiff = getCalendarDayDiff(now, stats.lastRevisionDate);
  if (dayDiff > 1 && stats.currentStreak > 0) {
    stats.currentStreak = 0;
    await stats.save();
  }

  return stats;
};

module.exports = {
  updateUserStreak,
  getStreakStats
};
