// Global error handlers for production
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
require('dotenv').config();

// Import utilities and middleware
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');
const { requestLogger, securityLogger, errorLogger } = require('./middleware/logging');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');

// Import models to ensure associations are set up
require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (important for rate limiting and logging real IPs)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.security('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(requestLogger);
app.use(securityLogger);

// Basic ping endpoint (no database required)
app.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

// Health check endpoint (before auth)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Catch unhandled routes
app.all('*', (req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorLogger);
app.use(globalErrorHandler);

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  server.close(() => {
    logger.info('Process terminated gracefully');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    console.log('📊 Environment:', process.env.NODE_ENV);
    console.log('🔑 OpenAI configured:', !!process.env.OPENAI_API_KEY);
    console.log('🗄️ Database URL configured:', !!process.env.DATABASE_URL);
    console.log('🚪 Port:', PORT);
    
    // Start HTTP server first (so health checks can pass)
    console.log('🚀 Starting HTTP server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
      const message = `🚀 Server running on port ${PORT}`;
      console.log(message);
      logger.info(message);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔑 OpenAI API configured: ${!!process.env.OPENAI_API_KEY}`);
      logger.info(`📝 Logging level: ${process.env.LOG_LEVEL || 'info'}`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
    // Store server reference for graceful shutdown
    global.server = server;
    
    // Connect to database after server is running
    console.log('📡 Connecting to database...');
    try {
      await connectDatabase();
      console.log('✅ Database connection successful');
      logger.info(`🗄️ Database: PostgreSQL connected`);
    } catch (dbError) {
      console.error('⚠️ Database connection failed, but server is still running:', dbError.message);
      logger.error('Database connection failed:', dbError);
      // Don't exit - let server run without database for debugging
    }
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('❌ Stack trace:', error.stack);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Debug environment variables (without exposing secrets)
console.log('🔍 Environment Debug:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL configured:', !!process.env.DATABASE_URL);
console.log('- OPENAI_API_KEY configured:', !!process.env.OPENAI_API_KEY);
console.log('- JWT_SECRET configured:', !!process.env.JWT_SECRET);
console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN);

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;