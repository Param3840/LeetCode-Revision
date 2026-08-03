const Submission = require('../models/Submission');
const { getStreakStats } = require('./streak.service');

// Helper to calculate level from XP
const calculateLevelInfo = (totalXP) => {
  const xpPerLevel = 200;
  const currentLevel = Math.floor(totalXP / xpPerLevel) + 1;
  const currentLevelXP = totalXP % xpPerLevel;
  const nextLevelXP = xpPerLevel;
  const progressPct = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

  return {
    currentLevel,
    totalXP,
    currentLevelXP,
    nextLevelXP,
    progressPct
  };
};

const getAchievementsData = async (userId) => {
  // Fetch all user submissions
  const allSubmissions = await Submission.find({ userId });
  const streakStats = await getStreakStats(userId);

  // STRICT RULE: Only submissions that have been explicitly reviewed count towards XP & Achievements
  const revisedSubmissions = allSubmissions.filter(sub => 
    sub.isRevised || 
    (sub.revisionCount && sub.revisionCount > 0) || 
    (Array.isArray(sub.revisionHistory) && sub.revisionHistory.length > 0)
  );

  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;
  let totalRevisionsCount = 0;
  const topicCounts = {};

  revisedSubmissions.forEach(sub => {
    if (sub.difficulty === 'Easy') easyCount++;
    else if (sub.difficulty === 'Medium') mediumCount++;
    else if (sub.difficulty === 'Hard') hardCount++;

    const revs = (Array.isArray(sub.revisionHistory) && sub.revisionHistory.length > 0)
      ? sub.revisionHistory.length
      : (sub.revisionCount || (sub.isRevised ? 1 : 0));
    
    totalRevisionsCount += revs;

    if (Array.isArray(sub.tags)) {
      sub.tags.forEach(tag => {
        if (tag) {
          const normalizedTag = tag.trim();
          topicCounts[normalizedTag] = (topicCounts[normalizedTag] || 0) + 1;
        }
      });
    }
  });

  const totalReviewedProblems = revisedSubmissions.length;
  const totalRevisionDays = streakStats.totalRevisionDays || 0;
  const currentStreak = streakStats.currentStreak || 0;
  const longestStreak = streakStats.longestStreak || 0;

  // XP Calculation - Driven ONLY by explicit revision activity
  let totalXP = 0;
  totalXP += easyCount * 10;
  totalXP += mediumCount * 20;
  totalXP += hardCount * 40;
  totalXP += totalRevisionsCount * 5;

  if (longestStreak >= 3) totalXP += 50;
  if (longestStreak >= 7) totalXP += 100;
  if (longestStreak >= 30) totalXP += 300;
  if (longestStreak >= 100) totalXP += 1000;

  const levelInfo = calculateLevelInfo(totalXP);

  // Define Achievements driven by Revision Activity
  const rawAchievements = [
    // Problems Reviewed
    { id: 'ps_1', category: 'Problem Solving', title: 'First Problem Reviewed', description: 'Review your first coding problem', icon: 'Code', current: totalReviewedProblems, target: 1 },
    { id: 'ps_10', category: 'Problem Solving', title: '10 Problems Reviewed', description: 'Build your revision habit with 10 reviewed problems', icon: 'Award', current: totalReviewedProblems, target: 10 },
    { id: 'ps_25', category: 'Problem Solving', title: '25 Problems Reviewed', description: 'Demonstrate revision mastery with 25 reviewed problems', icon: 'Zap', current: totalReviewedProblems, target: 25 },
    { id: 'ps_50', category: 'Problem Solving', title: '50 Problems Reviewed', description: 'Reach 50 reviewed coding problems', icon: 'CheckCircle', current: totalReviewedProblems, target: 50 },
    { id: 'ps_100', category: 'Problem Solving', title: '100 Problems Reviewed', description: 'Master 100 reviewed coding problems', icon: 'Target', current: totalReviewedProblems, target: 100 },
    { id: 'ps_250', category: 'Problem Solving', title: '250 Problems Reviewed', description: 'Achieve 250 reviewed problems milestone', icon: 'Shield', current: totalReviewedProblems, target: 250 },
    { id: 'ps_500', category: 'Problem Solving', title: '500 Problems Reviewed', description: 'Grandmaster of 500 reviewed coding problems', icon: 'Crown', current: totalReviewedProblems, target: 500 },

    // Revision Milestones
    { id: 'rev_1', category: 'Revision', title: 'First Review', description: 'Complete your first problem review action', icon: 'RefreshCw', current: totalRevisionsCount, target: 1 },
    { id: 'rev_10', category: 'Revision', title: '10 Revision Days', description: 'Revise problems across 10 active days', icon: 'Calendar', current: totalRevisionDays, target: 10 },
    { id: 'rev_30', category: 'Revision', title: '30 Revision Days', description: 'Maintain active revisions across 30 days', icon: 'Clock', current: totalRevisionDays, target: 30 },
    { id: 'rev_100', category: 'Revision', title: '100 Revision Days', description: 'Dedicate 100 days to active problem revision', icon: 'Flame', current: totalRevisionDays, target: 100 },

    // Consistency
    { id: 'con_3', category: 'Consistency', title: '3 Day Streak', description: 'Maintain a 3-day active revision streak', icon: 'Sparkles', current: longestStreak, target: 3 },
    { id: 'con_7', category: 'Consistency', title: '7 Day Streak', description: 'Maintain a 7-day active revision streak', icon: 'Flame', current: longestStreak, target: 7 },
    { id: 'con_30', category: 'Consistency', title: '30 Day Streak', description: 'Maintain a 30-day active revision streak', icon: 'Trophy', current: longestStreak, target: 30 },
    { id: 'con_100', category: 'Consistency', title: '100 Day Streak', description: 'Maintain a 100-day active revision streak', icon: 'Crown', current: longestStreak, target: 100 },

    // Difficulty
    { id: 'diff_1', category: 'Difficulty', title: 'First Hard Problem Reviewed', description: 'Review your first Hard difficulty problem', icon: 'Zap', current: hardCount, target: 1 },
    { id: 'diff_10', category: 'Difficulty', title: '10 Hard Problems Reviewed', description: 'Conquer 10 Hard difficulty problem reviews', icon: 'Shield', current: hardCount, target: 10 },
    { id: 'diff_25', category: 'Difficulty', title: '25 Hard Problems Reviewed', description: 'Master 25 Hard difficulty problem reviews', icon: 'Crown', current: hardCount, target: 25 },

    // Topics Reviewed
    { id: 'top_array', category: 'Topics', title: 'Array Explorer', description: 'Review 10 Array problems', icon: 'Layers', current: topicCounts['Array'] || 0, target: 10 },
    { id: 'top_string', category: 'Topics', title: 'String Explorer', description: 'Review 10 String problems', icon: 'FileText', current: topicCounts['String'] || 0, target: 10 },
    { id: 'top_tree', category: 'Topics', title: 'Tree Explorer', description: 'Review 10 Tree problems', icon: 'GitBranch', current: (topicCounts['Tree'] || 0) + (topicCounts['Binary Tree'] || 0), target: 10 },
    { id: 'top_graph', category: 'Topics', title: 'Graph Explorer', description: 'Review 10 Graph problems', icon: 'Share2', current: topicCounts['Graph'] || 0, target: 10 },
    { id: 'top_dp', category: 'Topics', title: 'Dynamic Programming Explorer', description: 'Review 10 Dynamic Programming problems', icon: 'Cpu', current: (topicCounts['Dynamic Programming'] || 0) + (topicCounts['DP'] || 0), target: 10 }
  ];

  let unlockedCount = 0;
  let nextGoal = null;
  let smallestRemaining = Infinity;

  const achievements = rawAchievements.map(ach => {
    const isUnlocked = ach.current >= ach.target;
    if (isUnlocked) {
      unlockedCount++;
    } else {
      const diff = ach.target - ach.current;
      if (diff < smallestRemaining) {
        smallestRemaining = diff;
        nextGoal = {
          title: ach.title,
          current: ach.current,
          target: ach.target,
          pct: Math.min(100, Math.round((ach.current / ach.target) * 100))
        };
      }
    }

    return {
      ...ach,
      isUnlocked,
      progressPct: Math.min(100, Math.round((Math.min(ach.current, ach.target) / ach.target) * 100))
    };
  });

  const totalBadges = achievements.length;
  const completionPct = Math.round((unlockedCount / totalBadges) * 100);

  return {
    levelInfo,
    summary: {
      unlockedCount,
      totalBadges,
      completionPct,
      nextGoal: nextGoal || { title: 'All Achievements Unlocked!', current: totalBadges, target: totalBadges, pct: 100 }
    },
    achievements
  };
};

module.exports = {
  getAchievementsData
};
