const Submission = require('../models/Submission');

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
      submissionId: submission._id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncSubmission
};
