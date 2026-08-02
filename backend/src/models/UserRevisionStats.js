const mongoose = require('mongoose');

const UserRevisionStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastRevisionDate: {
    type: Date,
    default: null
  },
  totalRevisionDays: {
    type: Number,
    default: 0
  },
  totalRevisions: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserRevisionStats', UserRevisionStatsSchema);
