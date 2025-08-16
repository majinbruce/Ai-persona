const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(stack && { stack }),
      ...meta
    });
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
require('fs').mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'persona-chatbot' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    
    // API access logs
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Console logging for all environments (Railway needs this)
logger.add(new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' 
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
      )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
}));

// Custom logging methods
logger.api = (method, url, statusCode, responseTime, userId) => {
  logger.http('API Request', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId,
    timestamp: new Date().toISOString()
  });
};

logger.security = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logger.business = (action, details) => {
  logger.info('Business Event', {
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;