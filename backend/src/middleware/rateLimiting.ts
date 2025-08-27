import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG, REGISTRATION_RATE_LIMIT_CONFIG } from '../config';
import { ApiError } from '../types';

/**
 * General rate limiting middleware
 */
export const generalRateLimit = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.windowMs,
  max: RATE_LIMIT_CONFIG.max,
  standardHeaders: RATE_LIMIT_CONFIG.standardHeaders,
  legacyHeaders: RATE_LIMIT_CONFIG.legacyHeaders,
  message: RATE_LIMIT_CONFIG.message,
  handler: (_req: Request, res: Response) => {
    const error: ApiError = {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: RATE_LIMIT_CONFIG.max,
          windowMs: RATE_LIMIT_CONFIG.windowMs,
          retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000),
        },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(error);
  },
});

/**
 * Registration-specific rate limiting middleware
 */
export const registrationRateLimit = rateLimit({
  windowMs: REGISTRATION_RATE_LIMIT_CONFIG.windowMs,
  max: REGISTRATION_RATE_LIMIT_CONFIG.max,
  standardHeaders: REGISTRATION_RATE_LIMIT_CONFIG.standardHeaders,
  legacyHeaders: REGISTRATION_RATE_LIMIT_CONFIG.legacyHeaders,
  message: REGISTRATION_RATE_LIMIT_CONFIG.message,
  handler: (_req: Request, res: Response) => {
    const error: ApiError = {
      success: false,
      message: 'Too many registration attempts from this IP, please try again later.',
      error: {
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
        details: {
          limit: REGISTRATION_RATE_LIMIT_CONFIG.max,
          windowMs: REGISTRATION_RATE_LIMIT_CONFIG.windowMs,
          retryAfter: Math.ceil(REGISTRATION_RATE_LIMIT_CONFIG.windowMs / 1000),
        },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(error);
  },
  // Use a combination of IP and email for more granular limiting
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  },
});

/**
 * Login rate limiting middleware
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    const error: ApiError = {
      success: false,
      message: 'Too many login attempts from this IP, please try again later.',
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        details: {
          limit: 10,
          windowMs: 15 * 60 * 1000,
          retryAfter: 900, // 15 minutes in seconds
        },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(error);
  },
  // Use a combination of IP and email for more granular limiting
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  },
});

/**
 * Email verification rate limiting middleware
 */
export const emailVerificationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 verification attempts per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    const error: ApiError = {
      success: false,
      message: 'Too many email verification attempts, please try again later.',
      error: {
        code: 'EMAIL_VERIFICATION_RATE_LIMIT_EXCEEDED',
        details: {
          limit: 3,
          windowMs: 5 * 60 * 1000,
          retryAfter: 300, // 5 minutes in seconds
        },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(error);
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email || req.query?.email || '';
    return `${req.ip}-${email}`;
  },
});

/**
 * Password reset rate limiting middleware
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 password reset requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    const error: ApiError = {
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      error: {
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        details: {
          limit: 3,
          windowMs: 10 * 60 * 1000,
          retryAfter: 600, // 10 minutes in seconds
        },
      },
      timestamp: new Date().toISOString(),
    };
    res.status(429).json(error);
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email || '';
    return `${req.ip}-${email}`;
  },
});