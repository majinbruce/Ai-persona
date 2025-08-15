const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security('Rate limit reached', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    logger.security('Auth rate limit reached', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts, please try again later.'
    });
  }
});

// Chat endpoint rate limiter
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 chat requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.security('Chat rate limit reached', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many chat requests, please slow down.'
    });
  }
});

// Premium users get higher limits
const premiumChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    // Return higher limit for premium users
    return req.user?.role === 'premium' ? 30 : 10;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

// Registration limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.security('Registration rate limit reached', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body
    });
    res.status(429).json({
      status: 'error',
      message: 'Too many registration attempts, please try again later.'
    });
  }
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  chatLimiter,
  premiumChatLimiter,
  registerLimiter,
  passwordResetLimiter
};