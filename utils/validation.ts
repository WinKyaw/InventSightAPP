import { LoginCredentials, SignupCredentials, ValidationError, FormValidation } from '../types/auth';

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation regex (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Name validation regex (only letters, spaces, hyphens, and apostrophes)
 */
const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationError | null => {
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }
  
  if (!EMAIL_REGEX.test(email.trim())) {
    return { field: 'email', message: 'Please enter a valid email address' };
  }
  
  return null;
};

/**
 * Validate password
 */
export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters long' };
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      field: 'password', 
      message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number' 
    };
  }
  
  return null;
};

/**
 * Validate name
 */
export const validateName = (name: string): ValidationError | null => {
  if (!name) {
    return { field: 'name', message: 'Name is required' };
  }
  
  if (!NAME_REGEX.test(name.trim())) {
    return { 
      field: 'name', 
      message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes' 
    };
  }
  
  return null;
};

/**
 * Validate terms acceptance
 */
export const validateTermsAcceptance = (accepted: boolean): ValidationError | null => {
  if (!accepted) {
    return { field: 'acceptedTerms', message: 'You must accept the terms of service to continue' };
  }
  
  return null;
};
export const validatePasswordConfirmation = (password: string, confirmPassword: string): ValidationError | null => {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: 'Passwords do not match' };
  }
  
  return null;
};

/**
 * Validate login form
 */
export const validateLoginForm = (credentials: LoginCredentials): FormValidation => {
  const errors: ValidationError[] = [];
  
  const emailError = validateEmail(credentials.email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(credentials.password);
  if (passwordError) errors.push(passwordError);
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate signup form
 */
export const validateSignupForm = (credentials: SignupCredentials): FormValidation => {
  const errors: ValidationError[] = [];
  
  const nameError = validateName(credentials.name);
  if (nameError) errors.push(nameError);
  
  const emailError = validateEmail(credentials.email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(credentials.password);
  if (passwordError) errors.push(passwordError);
  
  if (credentials.confirmPassword !== undefined) {
    const confirmPasswordError = validatePasswordConfirmation(credentials.password, credentials.confirmPassword);
    if (confirmPasswordError) errors.push(confirmPasswordError);
  }

  if (credentials.acceptedTerms !== undefined) {
    const termsError = validateTermsAcceptance(credentials.acceptedTerms);
    if (termsError) errors.push(termsError);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get error message for a specific field
 */
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find(err => err.field === field);
  return error ? error.message : null;
};

/**
 * Check if a field has an error
 */
export const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some(err => err.field === field);
};

/**
 * Sanitize input by trimming and basic cleaning
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * Check password strength
 */
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string;
  color: string;
} => {
  if (!password) {
    return { score: 0, feedback: 'Enter a password', color: '#9CA3AF' };
  }
  
  let score = 0;
  const feedback = [];
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('at least 8 characters');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('1 uppercase letter');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('1 lowercase letter');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('1 number');
  }
  
  // Special character check (bonus)
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  }
  
  const strengthMap = {
    0: { feedback: 'Very weak', color: '#EF4444' },
    1: { feedback: 'Weak', color: '#F97316' },
    2: { feedback: 'Fair', color: '#EAB308' },
    3: { feedback: 'Good', color: '#22C55E' },
    4: { feedback: 'Strong', color: '#16A34A' },
    5: { feedback: 'Very strong', color: '#15803D' },
  };
  
  if (feedback.length > 0) {
    return {
      score,
      feedback: `Need: ${feedback.join(', ')}`,
      color: strengthMap[score as keyof typeof strengthMap].color,
    };
  }
  
  return {
    score,
    feedback: strengthMap[score as keyof typeof strengthMap].feedback,
    color: strengthMap[score as keyof typeof strengthMap].color,
  };
};