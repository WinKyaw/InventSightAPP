import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { 
  SERVER_CONFIG, 
  CORS_CONFIG, 
  validateEnvironment,
  LOGGING_CONFIG,
} from './config';
import { sequelize } from './models';
import routes from './routes';
import { generalRateLimit } from './middleware/rateLimiting';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';
import { emailService } from './services/emailService';

// Load environment variables
dotenv.config();

// Validate environment
validateEnvironment();

// Create Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(CORS_CONFIG));

// Compression middleware
app.use(compression());

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (SERVER_CONFIG.nodeEnv === 'development') {
  app.use(morgan(LOGGING_CONFIG.format));
}

// Custom request logging
app.use(requestLogger);

// Rate limiting
app.use(generalRateLimit);

// API routes
app.use(SERVER_CONFIG.apiPrefix, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Initialize database and start server
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting InventSight API Server...');
    console.log(`📅 Current Date and Time (UTC): ${new Date().toISOString()}`);
    console.log(`🌍 Environment: ${SERVER_CONFIG.nodeEnv}`);
    console.log(`🔌 API Prefix: ${SERVER_CONFIG.apiPrefix}`);

    // Test database connection
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync database models
    console.log('🔄 Synchronizing database models...');
    if (SERVER_CONFIG.nodeEnv === 'development') {
      // In development, alter tables if they exist
      await sequelize.sync({ alter: true });
    } else {
      // In production, don't auto-sync (use migrations instead)
      await sequelize.sync();
    }
    console.log('✅ Database models synchronized successfully');

    // Test email service if enabled
    console.log('📧 Testing email service...');
    await emailService.testConnection();

    // Start HTTP server
    const server = app.listen(SERVER_CONFIG.port, () => {
      console.log('======================================================================');
      console.log('🎉 InventSight API Server Started Successfully!');
      console.log('======================================================================');
      console.log(`🌐 Server running on: http://localhost:${SERVER_CONFIG.port}`);
      console.log(`🔗 API Base URL: http://localhost:${SERVER_CONFIG.port}${SERVER_CONFIG.apiPrefix}`);
      console.log(`📊 Health Check: http://localhost:${SERVER_CONFIG.port}${SERVER_CONFIG.apiPrefix}/health`);
      console.log(`📝 API Info: http://localhost:${SERVER_CONFIG.port}${SERVER_CONFIG.apiPrefix}/`);
      console.log(`🛡️  CORS Origins: ${CORS_CONFIG.origin.join(', ')}`);
      console.log(`⏱️  Startup Time: ${Date.now() - startTime}ms`);
      console.log('======================================================================');
      
      console.log('📋 Available Endpoints:');
      console.log(`   POST ${SERVER_CONFIG.apiPrefix}/auth/register - User registration`);
      console.log(`   POST ${SERVER_CONFIG.apiPrefix}/auth/login - User login`);
      console.log(`   POST ${SERVER_CONFIG.apiPrefix}/auth/verify-email - Email verification`);
      console.log(`   GET  ${SERVER_CONFIG.apiPrefix}/auth/check-email - Check email existence`);
      console.log(`   POST ${SERVER_CONFIG.apiPrefix}/auth/resend-verification - Resend verification`);
      console.log(`   POST ${SERVER_CONFIG.apiPrefix}/auth/refresh - Refresh access token`);
      console.log(`   GET  ${SERVER_CONFIG.apiPrefix}/auth/profile - Get user profile`);
      console.log(`   POST ${SERVER_CONFIG.apiPrefix}/auth/logout - User logout`);
      console.log('======================================================================');
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('🔌 HTTP server closed');
        
        try {
          await sequelize.close();
          console.log('💾 Database connection closed');
        } catch (error) {
          console.error('❌ Error closing database connection:', error);
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force close server after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle process termination
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Track startup time
const startTime = Date.now();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, startServer };
export default app;