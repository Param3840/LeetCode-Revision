const CodingSession = require('../models/CodingSession');
const Submission = require('../models/Submission');

// Helper to format Date into YYYY-MM-DD local string
const toLocalDayString = (d) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Record session heartbeat and merge consecutive activity
// @route   POST /api/analytics/session/heartbeat
// @access  Private
const recordHeartbeat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { problemId, problemNumber, problemTitle, topicTags, durationDeltaSeconds } = req.body;

    const delta = Math.max(1, Math.min(Number(durationDeltaSeconds) || 30, 300)); // Cap delta between 1s and 5m
    const now = new Date();

    // Find active session for user within last 5 minutes (300,000 ms)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    let session = await CodingSession.findOne({
      userId,
      lastHeartbeat: { $gte: fiveMinutesAgo }
    }).sort({ lastHeartbeat: -1 });

    if (session) {
      // Merge into existing session
      session.endTime = now;
      session.lastHeartbeat = now;
      session.durationSeconds += delta;
      if (topicTags && Array.isArray(topicTags) && topicTags.length > 0) {
        // Merge topic tags
        const tagSet = new Set([...(session.topicTags || []), ...topicTags]);
        session.topicTags = Array.from(tagSet);
      }
      await session.save();
    } else {
      // Create new coding session
      session = new CodingSession({
        userId,
        problemId: problemId || null,
        problemNumber: problemNumber || "",
        problemTitle: problemTitle || "Coding Workspace",
        topicTags: topicTags || [],
        startTime: now,
        endTime: now,
        durationSeconds: delta,
        lastHeartbeat: now
      });
      await session.save();
    }

    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated Coding Time Analytics
// @route   GET /api/analytics/coding-time
// @access  Private
const getCodingTimeAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all coding sessions for user
    const sessions = await CodingSession.find({ userId });
    const submissions = await Submission.find({ userId });

    const now = new Date();
    const todayStr = toLocalDayString(now);

    // Calculate Week start (Sunday 00:00:00)
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Calculate Month start (1st of month 00:00:00)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todaySeconds = 0;
    let weekSeconds = 0;
    let monthSeconds = 0;
    let totalSeconds = 0;
    let longestSessionSeconds = 0;

    const topicTimeMap = {};

    sessions.forEach(s => {
      const dur = s.durationSeconds || 0;
      totalSeconds += dur;

      if (dur > longestSessionSeconds) {
        longestSessionSeconds = dur;
      }

      const sessionDateStr = toLocalDayString(s.endTime || s.startTime);
      if (sessionDateStr === todayStr) {
        todaySeconds += dur;
      }

      if (s.endTime >= startOfWeek) {
        weekSeconds += dur;
      }

      if (s.endTime >= startOfMonth) {
        monthSeconds += dur;
      }

      // Track time per topic
      if (Array.isArray(s.topicTags)) {
        s.topicTags.forEach(tag => {
          if (tag) {
            topicTimeMap[tag] = (topicTimeMap[tag] || 0) + dur;
          }
        });
      }
    });

    // Topic Solved Count from Submissions
    const topicSolvedMap = {};
    submissions.forEach(sub => {
      if (Array.isArray(sub.tags)) {
        sub.tags.forEach(tag => {
          if (tag) {
            topicSolvedMap[tag] = (topicSolvedMap[tag] || 0) + 1;
          }
        });
      }
    });

    // Determine Most Solved Topic
    let mostSolvedTopic = "N/A";
    let maxSolvedCount = 0;
    Object.keys(topicSolvedMap).forEach(tag => {
      if (topicSolvedMap[tag] > maxSolvedCount) {
        maxSolvedCount = topicSolvedMap[tag];
        mostSolvedTopic = tag;
      }
    });

    // Determine Most Time Spent Topic
    let mostTimeSpentTopic = "N/A";
    let maxTopicTime = 0;
    Object.keys(topicTimeMap).forEach(tag => {
      if (topicTimeMap[tag] > maxTopicTime) {
        maxTopicTime = topicTimeMap[tag];
        mostTimeSpentTopic = tag;
      }
    });

    // Average Time Per Problem
    const totalProblems = submissions.length || 1;
    const avgSecondsPerProblem = totalSeconds > 0 ? Math.round(totalSeconds / totalProblems) : 0;

    // Build last 7 days chart data
    const dailyChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = toLocalDayString(d);

      let daySecs = 0;
      sessions.forEach(s => {
        if (toLocalDayString(s.endTime || s.startTime) === dStr) {
          daySecs += s.durationSeconds || 0;
        }
      });

      dailyChart.push({
        date: dStr,
        dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: Math.round((daySecs / 60) * 10) / 10
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        todaySeconds,
        weekSeconds,
        monthSeconds,
        totalSeconds,
        totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
        avgSecondsPerProblem,
        longestSessionSeconds,
        mostSolvedTopic,
        mostTimeSpentTopic,
        dailyChart
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordHeartbeat,
  getCodingTimeAnalytics
};
