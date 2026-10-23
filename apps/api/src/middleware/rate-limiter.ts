import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'TOO_MANY_REQUESTS',
  },
});

// Per client IP (see `trust proxy` in app.ts). Generous enough that a few
// people behind one office NAT can try the demo logins.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    code: 'TOO_MANY_REQUESTS',
  },
});

export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
