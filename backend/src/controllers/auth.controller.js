const https = require('https');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Helper function for POST/GET requests via native Node.js https module as fallback
const httpsRequest = (urlStr, options = {}, bodyData = null) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const reqOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ ok: false, status: res.statusCode, data: { raw: data } });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.setTimeout(12000, () => {
        req.destroy(new Error('HTTPS request timed out after 12 seconds'));
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Resilient HTTP request helper with native fetch + https fallback
const resilientFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(8000)
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (fetchErr) {
    console.warn(`[CodeRevise][OAuth] Native fetch failed (${fetchErr.message}). Retrying via HTTPS module...`);
    const bodyStr = options.body ? options.body.toString() : null;
    const headers = { ...(options.headers || {}) };
    if (bodyStr && !headers['Content-Length']) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    return await httpsRequest(url, { method: options.method || 'GET', headers }, bodyStr);
  }
};

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

    const tokenBody = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    // 1. Exchange auth code for tokens
    const tokenResult = await resilientFetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody
    });

    if (!tokenResult.ok) {
      console.error('[CodeRevise][OAuth] Token exchange failed:', tokenResult.data);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_exchange_failed`);
    }

    const { access_token } = tokenResult.data;

    console.log('[CodeRevise][OAuth] Retrieving user profile from Google.');
    // 2. Fetch user profile
    const profileResult = await resilientFetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!profileResult.ok) {
      console.error('[CodeRevise][OAuth] Failed to fetch user info:', profileResult.data);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=profile_fetch_failed`);
    }

    const { sub: googleId, name, email, picture } = profileResult.data;

    console.log('[CodeRevise][OAuth] Profile received:', { googleId, email, name });

    // 3. Find or create user in MongoDB
    let user = await User.findOne({ googleId });
    
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
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

    // 5. Redirect user to frontend with credentials as URL search parameters
    const frontendUrl = `${process.env.FRONTEND_URL}/login`;
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
    console.error('[CodeRevise][OAuth] Callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
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
