const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { recordHeartbeat, getCodingTimeAnalytics } = require('../controllers/codingTime.controller');

router.post('/session/heartbeat', protect, recordHeartbeat);
router.get('/coding-time', protect, getCodingTimeAnalytics);

module.exports = router;
