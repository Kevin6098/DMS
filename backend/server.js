const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const organizationRoutes = require('./routes/organizations');
const fileRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - Configure helmet to allow iframe embedding for previews
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'frame-ancestors': ["'self'", 'http://localhost:3000', 'https://taskinsight.my'],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for previews
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - Disabled for development
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
// Note: For file uploads, multer handles size limits separately
// These limits are for JSON/URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Increase server timeout for large file uploads (2 hours)
// This is important for uploads of files up to 2GB
const serverTimeout = parseInt(process.env.SERVER_TIMEOUT) || 7200000; // 2 hours default

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', {
    message: error.message,
    code: error.code,
    status: error.status,
    url: req.url,
    method: req.method,
    contentType: req.headers['content-type'],
    body: req.body,
    stack: error.stack
  });
  
  // Handle JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    console.error('JSON Parse Error - Request body:', {
      body: req.body,
      bodyType: typeof req.body,
      headers: req.headers
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body. Please check your request data.',
      error: error.message
    });
  }
  
  // Handle multer errors that weren't caught
  if (error.code === 'LIMIT_FILE_SIZE') {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024 * 1024;
    const maxSizeGB = (maxSize / (1024 * 1024 * 1024)).toFixed(2);
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum file size is ${maxSizeGB} GB.`
    });
  }
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      code: error.code 
    })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Server starting without database connection');
    }

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`⏱️  Server timeout: ${serverTimeout / 1000}s (${serverTimeout / 3600000}h)`);
    });
    
    // Set server timeout for large file uploads
    server.timeout = serverTimeout;
    server.keepAliveTimeout = serverTimeout;
    server.headersTimeout = serverTimeout + 1000; // Slightly longer than keepAliveTimeout
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
