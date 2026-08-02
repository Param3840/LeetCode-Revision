const { getStreakStats } = require('../services/streak.service');

// @desc    Get user's daily revision streak statistics
// @route   GET /api/revision/streak
// @access  Private
const getRevisionStreak = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const streakData = await getStreakStats(userId);

    return res.status(200).json({
      success: true,
      data: streakData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRevisionStreak
};
