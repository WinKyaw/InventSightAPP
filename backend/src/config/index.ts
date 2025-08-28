import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration
export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
};

// Database configuration
export const DATABASE_CONFIG = {
  dialect: (process.env.DB_DIALECT || 'sqlite') as 'sqlite' | 'postgres' | 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'inventsight.db',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  storage: ':memory:', // Use in-memory database for this demo
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

// JWT configuration
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP, please try again later.',
  },
};

// Registration-specific rate limiting
export const REGISTRATION_RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.REGISTRATION_RATE_LIMIT_MAX || '5'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'REGISTRATION_RATE_LIMIT',
    message: 'Too many registration attempts from this IP, please try again later.',
  },
};

// Email configuration
export const EMAIL_CONFIG = {
  enabled: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@inventsight.com',
};

// Security configuration
export const SECURITY_CONFIG = {
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  csrfSecret: process.env.CSRF_SECRET || 'your-csrf-secret-key',
};

// CORS configuration
export const CORS_CONFIG = {
  origin: (process.env.FRONTEND_URL || 'http://localhost:8081').split(',').map(url => url.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Login', 'X-Request-Timestamp'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Validation configuration
export const VALIDATION_CONFIG = {
  email: {
    maxLength: 254,
    regex: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  },
  name: {
    minLength: 2,
    maxLength: 50,
    regex: /^[a-zA-Z\s'-]{2,50}$/,
  },
};

// API Documentation configuration
export const SWAGGER_CONFIG = {
  enabled: process.env.SWAGGER_ENABLED === 'true',
  title: 'InventSight API',
  description: 'Comprehensive API for InventSight App registration and authentication',
  version: '1.0.0',
  basePath: SERVER_CONFIG.apiPrefix,
};

// Logging configuration
export const LOGGING_CONFIG = {
  level: process.env.LOG_LEVEL || 'debug',
  format: process.env.LOG_FORMAT || 'combined',
};

// Environment validation
export function validateEnvironment(): void {
  const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  if (process.env.NODE_ENV === 'production') {
    const prodRequiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const defaultValues = [
      'your-super-secret-jwt-key-change-in-production',
      'your-super-secret-refresh-key-change-in-production'
    ];
    
    prodRequiredVars.forEach((varName, index) => {
      if (process.env[varName] === defaultValues[index]) {
        throw new Error(`Please change the default value for ${varName} in production`);
      }
    });
  }
}