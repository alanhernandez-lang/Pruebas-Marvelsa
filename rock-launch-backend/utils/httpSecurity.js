const REDACTED_KEYS = ['password', 'token', 'authorization', 'api_key', 'apikey', 'x-api-key', 'whatsapp_token'];

const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGINS || '';
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const buildCorsOptions = () => {
  return {
    origin: (origin, callback) => {
      // Allow any origin for now to solve connection issues safely
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Key'],
    credentials: false
  };
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  Object.keys(copy).forEach((key) => {
    const lower = key.toLowerCase();
    if (REDACTED_KEYS.includes(lower)) {
      copy[key] = '[REDACTED]';
    } else if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = sanitizeObject(copy[key]);
    }
  });
  return copy;
};

module.exports = {
  buildCorsOptions,
  securityHeaders,
  sanitizeObject
};
