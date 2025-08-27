// User-related types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  passwordHash: string;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Registration request types
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  message: string;
}

// Verification types
export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface CheckEmailResponse {
  exists: boolean;
  verified?: boolean;
}

// JWT Payload types
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenType: 'access' | 'refresh';
}

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenType: 'refresh';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Database model interfaces
export interface UserCreationAttributes {
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
  emailVerified?: boolean;
}

export interface UserUpdateAttributes {
  name?: string;
  email?: string;
  role?: string;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
  passwordHash?: string;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

// Express Request extensions
declare global {
  namespace Express {
    interface Request {
      user?: User;
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

// Configuration types
export interface DatabaseConfig {
  dialect: 'sqlite' | 'postgres' | 'mysql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  storage?: string; // for sqlite
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  message?: any;
}

// Email template types
export interface EmailVerificationData {
  name: string;
  email: string;
  verificationUrl: string;
  token: string;
}

export interface PasswordResetData {
  name: string;
  email: string;
  resetUrl: string;
  token: string;
}