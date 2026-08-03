const { getAchievementsData } = require('../services/achievement.service');

// @desc    Get user level, XP, and achievements summary
// @route   GET /api/achievements
// @access  Private
const getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = await getAchievementsData(userId);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserAchievements
};
