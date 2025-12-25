// Authentication-related types and interfaces

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  acceptedTerms?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  profilePicture?: string;
  verified?: boolean;
  companyId?: string;  // Company ID for multi-tenant operations
  activeStoreId?: string;  // Active store ID for receipt creation
  activeStoreName?: string;  // Active store name for display
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  message?: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  tokens: AuthTokens | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// API Request/Response interfaces
export interface AuthApiRequest<T = any> {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: T;
  requiresAuth?: boolean;
}

export interface AuthApiResponse<T = any> {
  data: T;
  message: string;
  status: number;
  timestamp: string;
}

// Token storage keys
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  TOKEN_EXPIRY: 'token_expiry',
} as const;

export type TokenKey = typeof TOKEN_KEYS[keyof typeof TOKEN_KEYS];

// JWT Token Claims
export interface JWTClaims {
  sub?: string;
  userId?: string;
  tenant_id?: string;
  exp?: number;
  iat?: number;
  [key: string]: any; // Allow other claims
}