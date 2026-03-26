const crypto = require('crypto');

const safeEqual = (a, b) => {
  const aBuf = Buffer.from(String(a || ''));
  const bBuf = Buffer.from(String(b || ''));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return req.headers['x-api-key'] || req.headers['x-admin-key'] || null;
};

module.exports = function requireAdminAuth(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey) {
    return res.status(503).json({
      error: 'Server misconfiguration: missing ADMIN_API_KEY.'
    });
  }

  const provided = extractToken(req);
  if (!provided || !safeEqual(provided, configuredKey)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};
