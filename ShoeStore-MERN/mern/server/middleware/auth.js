const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Requires a valid token. Loads the user (with shop) onto req.user.
// This is the REST equivalent of Blazor's AuthService.CurrentUser / CurrentShop.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Not authenticated.' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('shopId');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Not authenticated.' });

    req.user = user;
    req.shop = user.shopId || null; // populated Shop document or null
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// Requires the user to also have a shop set up (mirrors AuthService.HasShop).
function requireShop(req, res, next) {
  if (!req.shop) return res.status(400).json({ message: 'You must set up a shop first.' });
  next();
}

module.exports = { signToken, requireAuth, requireShop, JWT_SECRET };
