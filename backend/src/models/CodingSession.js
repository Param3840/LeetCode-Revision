const mongoose = require('mongoose');

const CodingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    default: null
  },
  problemNumber: {
    type: String,
    default: ""
  },
  problemTitle: {
    type: String,
    default: ""
  },
  topicTags: [{
    type: String
  }],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: Date.now
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

CodingSessionSchema.index({ userId: 1, startTime: -1 });
CodingSessionSchema.index({ userId: 1, lastHeartbeat: -1 });

module.exports = mongoose.model('CodingSession', CodingSessionSchema);
