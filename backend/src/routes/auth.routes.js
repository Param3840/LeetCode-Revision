const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { registerUser, loginUser, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters long').isLength({ min: 8 })
  ],
  registerUser
);

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').not().isEmpty()
  ],
  loginUser
);

router.get('/me', protect, getMe);

module.exports = router;
