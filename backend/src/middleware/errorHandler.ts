import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'sequelize';
import { ApiError } from '../types';

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error);

  // Handle Sequelize validation errors
  if (error instanceof ValidationError) {
    const apiError: ApiError = {
      success: false,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.errors.map((err: any) => ({
          field: err.path,
          message: err.message,
          value: err.value,
        })),
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(apiError);
    return;
  }

  // Handle Sequelize unique constraint errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors?.[0]?.path || 'field';
    let message = 'A record with this value already exists';
    
    if (field === 'email') {
      message = 'An account with this email address already exists';
    }

    const apiError: ApiError = {
      success: false,
      message,
      error: {
        code: 'DUPLICATE_ENTRY',
        details: { field, value: error.errors?.[0]?.value },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(409).json(apiError);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const apiError: ApiError = {
      success: false,
      message: 'Invalid token',
      error: {
        code: 'INVALID_TOKEN',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(apiError);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const apiError: ApiError = {
      success: false,
      message: 'Token has expired',
      error: {
        code: 'TOKEN_EXPIRED',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(apiError);
    return;
  }

  // Handle custom API errors
  if (error.status || error.statusCode) {
    const apiError: ApiError = {
      success: false,
      message: error.message || 'An error occurred',
      error: {
        code: error.code || 'CUSTOM_ERROR',
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    };
    res.status(error.status || error.statusCode).json(apiError);
    return;
  }

  // Handle database connection errors
  if (error.name === 'ConnectionError' || error.name === 'ConnectionRefusedError') {
    const apiError: ApiError = {
      success: false,
      message: 'Database connection error',
      error: {
        code: 'DATABASE_ERROR',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(503).json(apiError);
    return;
  }

  // Default internal server error
  const apiError: ApiError = {
    success: false,
    message: 'Internal server error',
    error: {
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
    timestamp: new Date().toISOString(),
  };
  res.status(500).json(apiError);
}

/**
 * Handle 404 Not Found errors
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const apiError: ApiError = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: {
      code: 'ROUTE_NOT_FOUND',
      details: {
        method: req.method,
        url: req.originalUrl,
      },
    },
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(apiError);
}

/**
 * Async error wrapper to catch async function errors
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // For Express middleware, the third argument is the next function
      if (args.length >= 3 && typeof args[2] === 'function') {
        const next = args[2] as NextFunction;
        next(error);
      }
      throw error;
    }
  };
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const userAgent = req.headers['user-agent'] || 'unknown';
    const userLogin = req.headers['x-user-login'] || 'anonymous';
    
    console.log(`🔄 InventSightApp API Request: ${req.method} ${req.originalUrl}`);
    console.log(`📅 Current Date and Time (UTC): ${timestamp}`);
    console.log(`👤 Current User's Login: ${userLogin}`);
    console.log(`⏱️  Request Duration: ${duration}ms`);
    console.log(`📱 User Agent: ${userAgent}`);
    console.log(`✅ Response Status: ${res.statusCode}`);
    
    if (req.body && Object.keys(req.body).length > 0) {
      // Log request body but hide sensitive fields
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[HIDDEN]';
      if (sanitizedBody.token) sanitizedBody.token = '[HIDDEN]';
      console.log('📤 Request Body:', JSON.stringify(sanitizedBody, null, 2));
    }
  });
  
  next();
}