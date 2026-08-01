const express = require('express');
const router = express.Router();
const { syncSubmission } = require('../controllers/submission.controller');
const { protect } = require('../middleware/auth.middleware');

// Protected endpoint to sync a submission
router.post('/', protect, syncSubmission);

module.exports = router;
