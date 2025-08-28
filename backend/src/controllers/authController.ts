import { Request, Response } from 'express';
import { User } from '../models';
import { 
  RegisterRequest, 
  RegisterResponse, 
  VerifyEmailRequest, 
  ResendVerificationRequest,
  CheckEmailResponse,
  ApiResponse,
  ApiError,
} from '../types';
import { hashPassword, comparePassword, generateSecureToken } from '../utils/crypto';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { validateRegistrationData, sanitizeInput } from '../utils/validation';
import { EMAIL_CONFIG } from '../config';
import { emailService } from '../services/emailService';

/**
 * Register a new user
 * POST /auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password }: RegisterRequest = req.body;

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email).toLowerCase(),
      password: password, // Don't sanitize password as it might remove valid characters
    };

    // Validate input data
    const validation = validateRegistrationData(sanitizedData);
    if (!validation.isValid) {
      const apiError: ApiError = {
        success: false,
        message: 'Validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          details: validation.errors,
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(sanitizedData.email);
    if (existingUser) {
      const apiError: ApiError = {
        success: false,
        message: 'An account with this email address already exists',
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          details: { email: sanitizedData.email },
        },
        timestamp: new Date().toISOString(),
      };
      res.status(409).json(apiError);
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(sanitizedData.password);

    // Generate email verification token if email verification is enabled
    let emailVerificationToken: string | null = null;
    let emailVerificationExpires: Date | null = null;
    
    if (EMAIL_CONFIG.enabled) {
      emailVerificationToken = generateSecureToken();
      emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    // Create user
    const user = await User.create({
      email: sanitizedData.email,
      name: sanitizedData.name,
      passwordHash,
      role: 'user',
      emailVerified: !EMAIL_CONFIG.enabled, // Auto-verify if email verification is disabled
      emailVerificationToken,
      emailVerificationExpires,
    });

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    // Send verification email if enabled
    if (EMAIL_CONFIG.enabled && emailVerificationToken) {
      try {
        await emailService.sendVerificationEmail({
          name: user.name,
          email: user.email,
          verificationUrl: `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${emailVerificationToken}`,
          token: emailVerificationToken,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email sending fails
      }
    }

    // Prepare response
    const response: ApiResponse<RegisterResponse> = {
      success: true,
      data: {
        user: user.toPublicJSON(),
        tokens,
        message: EMAIL_CONFIG.enabled 
          ? 'Registration successful. Please check your email to verify your account.'
          : 'Registration successful. You are now logged in.',
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ User registered successfully: ${user.email}`);
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    const apiError: ApiError = {
      success: false,
      message: 'Registration failed',
      error: {
        code: 'REGISTRATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(apiError);
  }
}

/**
 * Verify user email
 * POST /auth/verify-email
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { token }: VerifyEmailRequest = req.body;

    if (!token) {
      const apiError: ApiError = {
        success: false,
        message: 'Verification token is required',
        error: {
          code: 'MISSING_TOKEN',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    // Find user by verification token
    const user = await User.findByEmailVerificationToken(token);
    
    if (!user) {
      const apiError: ApiError = {
        success: false,
        message: 'Invalid or expired verification token',
        error: {
          code: 'INVALID_VERIFICATION_TOKEN',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    // Update user verification status
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    const response: ApiResponse = {
      success: true,
      message: 'Email verified successfully',
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Email verified successfully for user: ${user.email}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Email verification error:', error);
    const apiError: ApiError = {
      success: false,
      message: 'Email verification failed',
      error: {
        code: 'EMAIL_VERIFICATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(apiError);
  }
}

/**
 * Check if email exists
 * GET /auth/check-email?email=user@example.com
 */
export async function checkEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.query as { email?: string };

    if (!email) {
      const apiError: ApiError = {
        success: false,
        message: 'Email parameter is required',
        error: {
          code: 'MISSING_EMAIL',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    const sanitizedEmail = sanitizeInput(email as string).toLowerCase();
    const user = await User.findByEmail(sanitizedEmail);

    const responseData: CheckEmailResponse = {
      exists: !!user,
      verified: user?.emailVerified || false,
    };

    const response: ApiResponse<CheckEmailResponse> = {
      success: true,
      data: responseData,
      message: 'Email check completed',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Email check error:', error);
    const apiError: ApiError = {
      success: false,
      message: 'Email check failed',
      error: {
        code: 'EMAIL_CHECK_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(apiError);
  }
}

/**
 * Resend verification email
 * POST /auth/resend-verification
 */
export async function resendVerification(req: Request, res: Response): Promise<void> {
  try {
    const { email }: ResendVerificationRequest = req.body;

    if (!EMAIL_CONFIG.enabled) {
      const apiError: ApiError = {
        success: false,
        message: 'Email verification is not enabled',
        error: {
          code: 'EMAIL_VERIFICATION_DISABLED',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    if (!email) {
      const apiError: ApiError = {
        success: false,
        message: 'Email is required',
        error: {
          code: 'MISSING_EMAIL',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const user = await User.findByEmail(sanitizedEmail);

    if (!user) {
      // Don't reveal whether the email exists for security reasons
      const response: ApiResponse = {
        success: true,
        message: 'If an account with that email exists, a verification email has been sent.',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
      return;
    }

    if (user.emailVerified) {
      const response: ApiResponse = {
        success: true,
        message: 'Email is already verified',
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
      return;
    }

    // Generate new verification token
    const emailVerificationToken = generateSecureToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail({
        name: user.name,
        email: user.email,
        verificationUrl: `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${emailVerificationToken}`,
        token: emailVerificationToken,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      const apiError: ApiError = {
        success: false,
        message: 'Failed to send verification email',
        error: {
          code: 'EMAIL_SEND_FAILED',
          details: emailError instanceof Error ? emailError.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(apiError);
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Verification email sent successfully',
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ Verification email resent to: ${user.email}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Resend verification error:', error);
    const apiError: ApiError = {
      success: false,
      message: 'Failed to resend verification email',
      error: {
        code: 'RESEND_VERIFICATION_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(apiError);
  }
}

/**
 * Login user
 * POST /auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const apiError: ApiError = {
        success: false,
        message: 'Email and password are required',
        error: {
          code: 'MISSING_CREDENTIALS',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const user = await User.findByEmail(sanitizedEmail);

    if (!user) {
      const apiError: ApiError = {
        success: false,
        message: 'Invalid email or password',
        error: {
          code: 'INVALID_CREDENTIALS',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(apiError);
      return;
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const apiError: ApiError = {
        success: false,
        message: 'Invalid email or password',
        error: {
          code: 'INVALID_CREDENTIALS',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(apiError);
      return;
    }

    // Generate tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    const response: ApiResponse<RegisterResponse> = {
      success: true,
      data: {
        user: user.toPublicJSON(),
        tokens,
        message: 'Login successful',
      },
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ User logged in successfully: ${user.email}`);
    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    const apiError: ApiError = {
      success: false,
      message: 'Login failed',
      error: {
        code: 'LOGIN_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(apiError);
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const apiError: ApiError = {
        success: false,
        message: 'Refresh token is required',
        error: {
          code: 'MISSING_REFRESH_TOKEN',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(apiError);
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user from database
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      const apiError: ApiError = {
        success: false,
        message: 'User not found',
        error: {
          code: 'USER_NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(apiError);
      return;
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email, user.role);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Token refresh error:', error);
    const apiError: ApiError = {
      success: false,
      message: 'Token refresh failed',
      error: {
        code: 'TOKEN_REFRESH_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(apiError);
  }
}