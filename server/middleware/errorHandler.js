const logger = require('../utils/logger');
const { AppError, handleSequelizeError, handleJWTError } = require('../utils/errors');

const sendErrorDev = (err, req, res) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  
  // Non-API errors
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        ...(err.errors && { errors: err.errors })
      });
    }
    
    // Programming or other unknown error: don't leak error details
    logger.error('Unexpected error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
  
  // Non-API errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  
  // Programming or other unknown error
  logger.error('Unexpected error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log error details
  const errorContext = {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  };
  
  if (err.statusCode >= 500) {
    logger.error('Server Error:', errorContext);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error:', errorContext);
  }
  
  // Handle specific error types
  let error = { ...err };
  error.message = err.message;
  
  // Sequelize errors
  if (err.name?.startsWith('Sequelize')) {
    error = handleSequelizeError(err);
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }
  
  // Mongoose cast errors (if we had MongoDB)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }
  
  // Validation errors
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, 400);
  }
  
  // Development vs Production error responses
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  console.log('UNHANDLED PROMISE REJECTION! 💥 Shutting down...');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  process.exit(1);
});

module.exports = {
  globalErrorHandler,
  catchAsync
};