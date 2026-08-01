const express = require('express');
const router = express.Router();
const { getProblemDetails } = require('../controllers/problem.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// GET /api/submissions/:problemNumber/details
router.get('/:problemNumber/details', getProblemDetails);

module.exports = router;
