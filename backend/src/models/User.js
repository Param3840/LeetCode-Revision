const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: [true, 'Google ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  picture: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    default: 'google'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
