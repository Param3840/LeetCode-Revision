const express = require('express');
const router = express.Router();
const { getRevisionStreak } = require('../controllers/streak.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/streak', getRevisionStreak);

module.exports = router;
