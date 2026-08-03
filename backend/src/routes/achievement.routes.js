const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getUserAchievements } = require('../controllers/achievement.controller');

router.get('/', protect, getUserAchievements);

module.exports = router;
