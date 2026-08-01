const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  problemNumber: {
    type: String,
    required: [true, 'Problem number is required'],
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    default: 'Medium'
  },
  tags: [{
    type: String
  }],
  companies: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [{
    type: String
  }],
  hints: [{
    type: String
  }],
  relatedProblems: [{
    problemNumber: String,
    title: String,
    slug: String,
    difficulty: String
  }],
  lastFetched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Problem', ProblemSchema);
