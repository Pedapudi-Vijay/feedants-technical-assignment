const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('../middleware/errorHandler');

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * POST /api/auth/register
 * Minimal signup so the mobile app has a real user/session to exercise the
 * registration & submission flows with. Not the focus of the assignment.
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new ApiError(400, 'name, email and password are required');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    res.status(201).json({
      data: {
        token: issueToken(user),
        user: { id: user._id, name: user.name, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'email and password are required');

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    res.json({
      data: {
        token: issueToken(user),
        user: { id: user._id, name: user.name, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
