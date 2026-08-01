const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemNumber: {
    type: String,
    required: [true, 'Problem number is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required']
  },
  tags: [{
    type: String
  }],
  language: {
    type: String,
    required: [true, 'Programming language is required']
  },
  solution: {
    type: String,
    required: [true, 'Solution code is required']
  },
  submittedAt: {
    type: Date,
    required: [true, 'Submission time is required'],
    default: Date.now
  },
  favorite: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ""
  },
  revisionStatus: {
    type: String,
    enum: ['New', 'Learning', 'Revising', 'Mastered'],
    default: 'New'
  },
  lastReviewed: {
    type: Date,
    default: null
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Enforce compound uniqueness for user + problemNumber combo
SubmissionSchema.index({ userId: 1, problemNumber: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
