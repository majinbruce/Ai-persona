const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log API request
    logger.api(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.user?.id
    );
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

const securityLogger = (req, res, next) => {
  // Log suspicious activity
  const suspiciousPatterns = [
    /\b(union|select|insert|delete|drop|create|alter)\b/i, // SQL injection
    /<script|javascript:|vbscript:|data:/i, // XSS
    /\.\.\/|\.\.\\|\.\.\%2f|\.\.\%5c/i, // Path traversal
    /passwd|shadow|hosts|boot\.ini/i, // System files
  ];
  
  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  
  // Check for suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body) || pattern.test(userAgent)
  );
  
  if (isSuspicious) {
    logger.security('Suspicious request detected', {
      ip: req.ip,
      userAgent,
      url,
      method: req.method,
      body: req.body,
      userId: req.user?.id
    });
  }
  
  // Log authentication failures
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security('Authentication/Authorization failure', {
        ip: req.ip,
        userAgent,
        url,
        method: req.method,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    }
  });
  
  next();
};

const errorLogger = (err, req, res, next) => {
  // Log error with request context
  logger.error('Request Error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(err);
};

module.exports = {
  requestLogger,
  securityLogger,
  errorLogger
};