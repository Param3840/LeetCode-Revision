const Submission = require('../models/Submission');
const { updateUserStreak, getStreakStats } = require('../services/streak.service');

// @desc    Sync an accepted LeetCode submission
// @route   POST /api/submissions
// @access  Private
const syncSubmission = async (req, res, next) => {
  try {
    const userId = req.user._id;
    console.log(`[CodeRevise][Submission] Authenticated User: ${userId}`);

    const {
      problemNumber,
      title,
      slug,
      url,
      difficulty,
      tags,
      language,
      solution,
      submittedAt
    } = req.body;

    // Check if duplicate exists
    const existing = await Submission.findOne({ userId, problemNumber });
    
    if (existing) {
      console.log('[CodeRevise][Submission] Existing submission found');
      console.log('[CodeRevise][Submission] Updating existing submission');
    } else {
      console.log('[CodeRevise][Submission] Creating new submission');
    }

    const submission = await Submission.findOneAndUpdate(
      { userId, problemNumber },
      {
        userId,
        problemNumber,
        title,
        slug,
        url,
        difficulty,
        tags: tags || [],
        language,
        solution,
        submittedAt: submittedAt ? new Date(submittedAt) : new Date()
      },
      { upsert: true, new: true }
    );

    console.log('[CodeRevise][Submission] Submission synced successfully');
    
    return res.status(200).json({
      success: true,
      submissionId: submission._id,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all submissions belonging to logged in user
// @route   GET /api/submissions
// @access  Private
const getAllSubmissions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submissions = await Submission.find({ userId }).sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single submission by ID
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submission = await Submission.findOne({ _id: req.params.id, userId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single submission by ID
// @route   DELETE /api/submissions/:id
// @access  Private
const deleteSubmission = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submission = await Submission.findOneAndDelete({ _id: req.params.id, userId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite status
// @route   PATCH /api/submissions/:id/favorite
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submission = await Submission.findOne({ _id: req.params.id, userId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const newFavoriteState = typeof req.body.favorite === 'boolean' 
      ? req.body.favorite 
      : !submission.favorite;

    submission.favorite = newFavoriteState;
    await submission.save();

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update revision status
// @route   PATCH /api/submissions/:id/revision
// @access  Private
const updateRevisionStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { revisionStatus } = req.body;

    const validStatuses = ['New', 'Learning', 'Revising', 'Mastered'];
    if (!validStatuses.includes(revisionStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid revision status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const submission = await Submission.findOne({ _id: req.params.id, userId });
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.revisionStatus = revisionStatus;
    submission.lastReviewed = new Date();
    submission.reviewCount = (submission.reviewCount || 0) + 1;

    await submission.save();

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save personal notes
// @route   PATCH /api/submissions/:id/notes
// @access  Private
const updateNotes = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notes } = req.body;

    const submission = await Submission.findOne({ _id: req.params.id, userId });
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.notes = typeof notes === 'string' ? notes : '';
    await submission.save();

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark submission as revised
// @route   PATCH /api/submissions/:id/revise
// @access  Private
const markRevised = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submission = await Submission.findOne({ _id: req.params.id, userId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const now = new Date();
    submission.isRevised = true;
    submission.revisionCount = (submission.revisionCount || 0) + 1;
    submission.lastRevisionDate = now;
    if (!submission.revisionHistory) {
      submission.revisionHistory = [];
    }
    submission.revisionHistory.push({ revisedAt: now });

    await submission.save();

    // Automatically update daily revision streak stats
    const streakStats = await updateUserStreak(userId, now);

    return res.status(200).json({
      success: true,
      data: submission,
      streak: streakStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset revision history
// @route   PATCH /api/submissions/:id/reset-revision
// @access  Private
const resetRevision = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const submission = await Submission.findOne({ _id: req.params.id, userId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.isRevised = false;
    submission.revisionCount = 0;
    submission.lastRevisionDate = null;
    // Preserve revisionHistory as an immutable historical log of past revision activity

    await submission.save();

    return res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated 365-day revision activity heatmap and stats
// @route   GET /api/submissions/heatmap
// @access  Private
// Helper to format Date into YYYY-MM-DD in local calendar time
const toLocalDayString = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get aggregated 365-day revision activity heatmap and stats
// @route   GET /api/submissions/heatmap
// @access  Private
const getHeatmapData = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all user submissions directly from MongoDB submissions collection
    const submissions = await Submission.find({ userId });

    const activityMap = {};

    let totalMasteredCount = 0;
    let totalReviewsCount = 0;

    submissions.forEach(sub => {
      if (sub.revisionStatus === 'Mastered') {
        totalMasteredCount++;
      }

      let hasRecordedActivity = false;

      // 1. Process explicit revisionHistory array entries
      if (Array.isArray(sub.revisionHistory) && sub.revisionHistory.length > 0) {
        sub.revisionHistory.forEach(entry => {
          if (entry && (entry.revisedAt || entry.createdAt)) {
            const dateStr = toLocalDayString(entry.revisedAt || entry.createdAt);
            if (dateStr) {
              if (!activityMap[dateStr]) {
                activityMap[dateStr] = {
                  revisedSet: new Set(),
                  masteredSet: new Set(),
                  reviewActions: 0
                };
              }
              activityMap[dateStr].reviewActions += 1;
              activityMap[dateStr].revisedSet.add(sub.problemNumber);
              totalReviewsCount += 1;
              hasRecordedActivity = true;
            }
          }
        });
      }

      // 2. Process isRevised / revisionCount fallback if revisionHistory wasn't logged
      if (sub.isRevised || (sub.revisionCount && sub.revisionCount > 0)) {
        const revisedDate = sub.lastRevisionDate || sub.updatedAt || sub.submittedAt || new Date();
        if (revisedDate) {
          const dateStr = toLocalDayString(revisedDate);
          if (dateStr) {
            if (!activityMap[dateStr]) {
              activityMap[dateStr] = {
                revisedSet: new Set(),
                masteredSet: new Set(),
                reviewActions: 0
              };
            }
            if (!hasRecordedActivity) {
              const actionCount = sub.revisionCount || 1;
              activityMap[dateStr].reviewActions += actionCount;
              activityMap[dateStr].revisedSet.add(sub.problemNumber || sub._id.toString());
              totalReviewsCount += actionCount;
              hasRecordedActivity = true;
            }
          }
        }
      }

      // 3. Process mastered status
      if (sub.revisionStatus === 'Mastered') {
        const masteredDate = sub.lastReviewed || sub.updatedAt || sub.submittedAt || new Date();
        if (masteredDate) {
          const dateStr = toLocalDayString(masteredDate);
          if (dateStr) {
            if (!activityMap[dateStr]) {
              activityMap[dateStr] = {
                revisedSet: new Set(),
                masteredSet: new Set(),
                reviewActions: 0
              };
            }
            activityMap[dateStr].masteredSet.add(sub.problemNumber || sub._id.toString());
          }
        }
      }
    });

    // 5. Generate 365-day array from 364 days ago to today
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activeDaysCount = 0;
    const activeDatesSet = new Set();

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDayString(d);

      const act = activityMap[dateStr] || {
        revisedSet: new Set(),
        masteredSet: new Set(),
        reviewActions: 0
      };

      const revisedCount = act.revisedSet ? act.revisedSet.size : 0;
      const masteredCount = act.masteredSet ? act.masteredSet.size : 0;
      const reviewActionsCount = act.reviewActions || 0;
      const totalCount = revisedCount + masteredCount + reviewActionsCount;

      if (totalCount > 0) {
        activeDaysCount++;
        activeDatesSet.add(dateStr);
      }

      let level = 0;
      if (totalCount === 1) level = 1;
      else if (totalCount >= 2 && totalCount <= 3) level = 2;
      else if (totalCount >= 4 && totalCount <= 6) level = 3;
      else if (totalCount >= 7) level = 4;

      days.push({
        date: dateStr,
        revisedCount,
        masteredCount,
        reviewActionsCount,
        totalCount,
        level
      });
    }

    // Dynamic streak calculation fallback
    const sortedActiveDates = Array.from(activeDatesSet).sort();
    let calcLongestStreak = 0;
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
      if (tempStreak > calcLongestStreak) {
        calcLongestStreak = tempStreak;
      }
      prevTimestamp = currentTimestamp;
    });

    let calcCurrentStreak = 0;
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
          calcCurrentStreak += 1;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Fetch single shared streak statistics source of truth & merge
    const streakStats = await getStreakStats(userId);

    const summary = {
      currentStreak: Math.max(streakStats.currentStreak || 0, calcCurrentStreak),
      longestStreak: Math.max(streakStats.longestStreak || 0, calcLongestStreak),
      totalRevisionDays: Math.max(streakStats.totalRevisionDays || 0, activeDaysCount),
      totalReviews: Math.max(streakStats.totalRevisions || 0, totalReviewsCount),
      masteredProblems: totalMasteredCount
    };

    return res.status(200).json({
      success: true,
      summary,
      days
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncSubmission,
  getAllSubmissions,
  getSubmissionById,
  deleteSubmission,
  toggleFavorite,
  updateRevisionStatus,
  updateNotes,
  markRevised,
  resetRevision,
  getHeatmapData
};
