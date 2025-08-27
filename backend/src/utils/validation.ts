import { VALIDATION_CONFIG } from '../config';
import { ValidationError, ValidationResult } from '../types';

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }

  if (email.length > VALIDATION_CONFIG.email.maxLength) {
    return { 
      field: 'email', 
      message: `Email must be no more than ${VALIDATION_CONFIG.email.maxLength} characters` 
    };
  }

  if (!VALIDATION_CONFIG.email.regex.test(email.trim())) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }

  return null;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationError | null {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }

  if (password.length < VALIDATION_CONFIG.password.minLength) {
    return { 
      field: 'password', 
      message: `Password must be at least ${VALIDATION_CONFIG.password.minLength} characters long` 
    };
  }

  if (password.length > VALIDATION_CONFIG.password.maxLength) {
    return { 
      field: 'password', 
      message: `Password must be no more than ${VALIDATION_CONFIG.password.maxLength} characters long` 
    };
  }

  if (!VALIDATION_CONFIG.password.regex.test(password)) {
    return { 
      field: 'password', 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
    };
  }

  return null;
}

/**
 * Validate name
 */
export function validateName(name: string): ValidationError | null {
  if (!name) {
    return { field: 'name', message: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < VALIDATION_CONFIG.name.minLength) {
    return { 
      field: 'name', 
      message: `Name must be at least ${VALIDATION_CONFIG.name.minLength} characters long` 
    };
  }

  if (trimmedName.length > VALIDATION_CONFIG.name.maxLength) {
    return { 
      field: 'name', 
      message: `Name must be no more than ${VALIDATION_CONFIG.name.maxLength} characters long` 
    };
  }

  if (!VALIDATION_CONFIG.name.regex.test(trimmedName)) {
    return { 
      field: 'name', 
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes' 
    };
  }

  return null;
}

/**
 * Validate registration data
 */
export function validateRegistrationData(data: { 
  name: string; 
  email: string; 
  password: string; 
}): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateName(data.name);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(data.email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.push(passwordError);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize input string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags and excessive whitespace
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
    .trim();                 // Remove leading/trailing whitespace
}

/**
 * Validate email verification token format
 */
export function validateVerificationToken(token: string): ValidationError | null {
  if (!token) {
    return { field: 'token', message: 'Verification token is required' };
  }

  if (token.length !== 64) { // hex tokens should be 64 characters
    return { field: 'token', message: 'Invalid verification token format' };
  }

  if (!/^[a-f0-9]+$/i.test(token)) {
    return { field: 'token', message: 'Invalid verification token format' };
  }

  return null;
}

/**
 * Get password strength score
 */
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isStrong: false,
    };
  }

  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  // Special character check (bonus)
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  }

  // Long password bonus
  if (password.length >= 12) {
    score += 1;
  }

  return {
    score: Math.min(score, 5),
    feedback,
    isStrong: score >= 4,
  };
}