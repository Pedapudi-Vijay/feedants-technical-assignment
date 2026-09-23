const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Requires a valid Bearer token. Attaches req.user (Mongo doc, minus passwordHash).
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

/**
 * Like requireAuth, but doesn't reject the request if there's no/invalid token -
 * it just leaves req.user undefined. Used on the GET competition details route so
 * logged-out users can still browse, but logged-in users get personalized state
 * (isRegistered, hasSubmitted, spotsLeft-aware CTA, etc.)
 */
async function attachUserIfPresent(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (user) req.user = user;
    next();
  } catch (err) {
    next(); // invalid token on an optional-auth route -> just treat as logged out
  }
}

module.exports = { requireAuth, attachUserIfPresent };
