const express = require('express');
const router = express.Router();
const { initiateGoogleAuth, handleGoogleCallback, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Google OAuth Routes
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);

// Profile Verification Route
router.get('/me', protect, getMe);

module.exports = router;
