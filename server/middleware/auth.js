const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (!token) {
      logger.security('Authentication failed', { 
        reason: 'No token provided',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(new AppError('Access token is required', 401));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      logger.security('Authentication failed', { 
        reason: 'User not found or inactive',
        userId: decoded.id,
        ip: req.ip
      });
      return next(new AppError('User not found or account inactive', 401));
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    logger.security('Authentication failed', { 
      reason: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    next(new AppError('Authentication failed', 401));
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      logger.security('Authorization failed', { 
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        route: req.path
      });
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user.id;
        }
      } catch (error) {
        // Token invalid, but continue without user
        logger.debug('Optional auth failed', { error: error.message });
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 401));
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      return next(new AppError('Invalid refresh token', 401));
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid refresh token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Refresh token expired', 401));
    }
    
    next(new AppError('Token refresh failed', 401));
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  refreshToken
};