const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// @desc    Initiate Google OAuth Redirect
// @route   GET /api/auth/google
// @access  Public
const initiateGoogleAuth = (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const queryString = new URLSearchParams(options).toString();
  const redirectUrl = `${rootUrl}?${queryString}`;
  
  console.log('[CodeRevise][OAuth] Redirecting user to Google consent page.');
  return res.redirect(redirectUrl);
};

// @desc    Handle Google OAuth Callback
// @route   GET /api/auth/google/callback
// @access  Public
const handleGoogleCallback = async (req, res, next) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is missing.'
    });
  }

  try {
    console.log('[CodeRevise][OAuth] Exchanging authorization code for tokens.');
    // 1. Exchange auth code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('[CodeRevise][OAuth] Token exchange failed:', tokenData);
      return res.status(401).json({
        success: false,
        message: 'Google authorization failed.'
      });
    }

    const { access_token } = tokenData;

    console.log('[CodeRevise][OAuth] Retrieving user profile from Google.');
    // 2. Fetch user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const profileData = await profileResponse.json();
    if (!profileResponse.ok) {
      console.error('[CodeRevise][OAuth] Failed to fetch user info:', profileData);
      return res.status(401).json({
        success: false,
        message: 'Failed to retrieve Google profile.'
      });
    }

    const { sub: googleId, name, email, picture } = profileData;

    console.log('[CodeRevise][OAuth] Profile received:', { googleId, email, name });

    // 3. Find or create user in MongoDB
    let user = await User.findOne({ googleId });
    
    // Fallback search by email if Google accounts are linked
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Link googleId to existing user
        user.googleId = googleId;
        user.picture = picture || user.picture;
        await user.save();
        console.log('[CodeRevise][OAuth] Linked Google sign-in to existing email account.');
      }
    }

    if (!user) {
      console.log('[CodeRevise][OAuth] Creating new user profile.');
      user = await User.create({
        googleId,
        name,
        email,
        picture,
        provider: 'google'
      });
    }

    // 4. Generate CodeRevise JWT
    const token = generateToken(user._id);

    // 5. Redirect user to the frontend with credentials as URL search parameters
    const frontendUrl = 'http://localhost:3000/login';
    const redirectParams = new URLSearchParams({
      token,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      picture: user.picture || ''
    }).toString();

    console.log('[CodeRevise][OAuth] Authentication successful. Redirecting back to web app.');
    return res.redirect(`${frontendUrl}?${redirectParams}`);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback,
  getMe
};
