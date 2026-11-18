import { z } from 'zod';

export const PASSWORD_RULES = {
  minLength: 10,
  maxLength: 64,
  upperRegex: /[A-Z]/,
  lowerRegex: /[a-z]/,
  numberRegex: /\d/,
  specialRegex: /[^A-Za-z0-9\s]/,
} as const;

export interface PasswordCriteria {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

export function checkPasswordCriteria(password: string): PasswordCriteria {
  const length = password.length >= PASSWORD_RULES.minLength;
  const upper = PASSWORD_RULES.upperRegex.test(password);
  const lower = PASSWORD_RULES.lowerRegex.test(password);
  const number = PASSWORD_RULES.numberRegex.test(password);
  const special = PASSWORD_RULES.specialRegex.test(password);

  return {
    length,
    upper,
    lower,
    number,
    special,
    hasMinLength: length,
    hasUppercase: upper,
    hasLowercase: lower,
    hasNumber: number,
    hasSpecialChar: special,
    isValid: length && upper && lower && number && special,
  };
}

export const passwordSchema = z
  .string({ error: (issue) => (issue.input === undefined ? 'Password is required' : undefined) })
  .min(
    PASSWORD_RULES.minLength,
    `Password must be at least ${PASSWORD_RULES.minLength} characters long`,
  )
  .max(PASSWORD_RULES.maxLength, `Password must not exceed ${PASSWORD_RULES.maxLength} characters`)
  .regex(PASSWORD_RULES.upperRegex, 'Password must contain at least one uppercase letter')
  .regex(PASSWORD_RULES.lowerRegex, 'Password must contain at least one lowercase letter')
  .regex(PASSWORD_RULES.numberRegex, 'Password must contain at least one number')
  .regex(PASSWORD_RULES.specialRegex, 'Password must contain at least one special character');

export const emailSchema = z
  .string({ error: (issue) => (issue.input === undefined ? 'Email is required' : undefined) })
  .trim()
  .min(1, 'Email is required')
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(254, 'Email must not exceed 254 characters');

export const uuidSchema = z
  .string({ error: (issue) => (issue.input === undefined ? 'ID is required' : undefined) })
  .guid('Invalid UUID format');

export const createTrimmedStringSchema = (fieldName: string, min = 1, max = 255): z.ZodString =>
  z
    .string({
      error: (issue) => (issue.input === undefined ? `${fieldName} is required` : undefined),
    })
    .trim()
    .min(min, `${fieldName} must be at least ${min} characters`)
    .max(max, `${fieldName} must not exceed ${max} characters`);

export function extractZodErrors(issues: readonly z.ZodIssue[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
