const Submission = require('../models/Submission');
const { updateUserStreak } = require('../services/streak.service');

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
    submission.revisionHistory = [];

    await submission.save();

    return res.status(200).json({
      success: true,
      data: submission
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
  resetRevision
};
