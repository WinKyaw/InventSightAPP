import jwt, { VerifyOptions } from 'jsonwebtoken';
import { JWT_CONFIG } from '../config';
import { JwtPayload, RefreshTokenPayload } from '../types';

/**
 * Generate access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'tokenType'>): string {
  const tokenPayload: JwtPayload = {
    ...payload,
    tokenType: 'access',
  };
  
  return jwt.sign(tokenPayload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    issuer: 'inventsight-api',
    audience: 'inventsight-app',
  } as any);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'tokenType'>): string {
  const tokenPayload: RefreshTokenPayload = {
    ...payload,
    tokenType: 'refresh',
  };
  
  return jwt.sign(tokenPayload, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
    issuer: 'inventsight-api',
    audience: 'inventsight-app',
  } as any);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(userId: string, email: string, role: string) {
  const accessToken = generateAccessToken({ userId, email, role });
  const refreshToken = generateRefreshToken({ userId, email });
  
  // Calculate expiration time in seconds
  const expiresIn = getTokenExpirationInSeconds(JWT_CONFIG.expiresIn);
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer',
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    const options: VerifyOptions = {
      issuer: 'inventsight-api',
      audience: 'inventsight-app',
    };
    
    const decoded = jwt.verify(token, JWT_CONFIG.secret, options) as JwtPayload;
    
    if (decoded.tokenType !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const options: VerifyOptions = {
      issuer: 'inventsight-api',
      audience: 'inventsight-app',
    };
    
    const decoded = jwt.verify(token, JWT_CONFIG.refreshSecret, options) as RefreshTokenPayload;
    
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Convert JWT expiration string to seconds
 */
function getTokenExpirationInSeconds(expiresIn: string): number {
  const timeMap: { [key: string]: number } = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
    'w': 604800,
  };
  
  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return 3600; // Default to 1 hour
  }
  
  const [, value, unit] = match;
  return parseInt(value) * timeMap[unit];
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}