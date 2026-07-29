/**
 * middleware/auth.js — JWT authentication & role guard.
 *
 * requireAuth: validates the Bearer token, attaches req.user.
 * requireAdmin: additionally enforces an 'admin' role.
 *
 * Tokens are signed with JWT_SECRET and sent by the client as
 * `Authorization: Bearer <token>`.
 */

const jwt = require('jsonwebtoken');

function authError(res, message, status = 401) {
  return res.status(status).json({ error: message });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return authError(res, 'Missing authentication token');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    return authError(res, 'Invalid or expired token');
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return authError(res, 'Admin access required', 403);
    }
    next();
  });
}

/**
 * optionalAuth: attaches req.user when a valid Bearer token is present,
 * but does NOT reject guests. Use for endpoints that work for both
 * (e.g. guest checkout that still links the order to a logged-in user).
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      // invalid token — treat as guest, don't fail the request
    }
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
