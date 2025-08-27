import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { User } from '../models';
import { ApiError } from '../types';

/**
 * Middleware to authenticate requests using JWT tokens
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      const error: ApiError = {
        success: false,
        message: 'Access token is required',
        error: {
          code: 'MISSING_TOKEN',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(error);
      return;
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      const error: ApiError = {
        success: false,
        message: 'User not found',
        error: {
          code: 'USER_NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(error);
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    const apiError: ApiError = {
      success: false,
      message: 'Invalid or expired access token',
      error: {
        code: 'INVALID_TOKEN',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(apiError);
  }
}

/**
 * Middleware to authenticate optional tokens (doesn't fail if no token)
 */
export async function authenticateOptionalToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findByPk(decoded.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Ignore authentication errors for optional authentication
        console.warn('Optional authentication failed:', error);
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
}

/**
 * Middleware to check if user has specific role
 */
export function requireRole(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: ApiError = {
        success: false,
        message: 'Authentication required',
        error: {
          code: 'AUTHENTICATION_REQUIRED',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(error);
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      const error: ApiError = {
        success: false,
        message: 'Insufficient permissions',
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          details: { requiredRoles: allowedRoles, userRole: req.user.role },
        },
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(error);
      return;
    }

    next();
  };
}

/**
 * Middleware to check if user's email is verified
 */
export function requireEmailVerification(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    const error: ApiError = {
      success: false,
      message: 'Authentication required',
      error: {
        code: 'AUTHENTICATION_REQUIRED',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(error);
    return;
  }

  if (!req.user.emailVerified) {
    const error: ApiError = {
      success: false,
      message: 'Email verification required',
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        details: 'Please verify your email address to access this resource',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(403).json(error);
    return;
  }

  next();
}