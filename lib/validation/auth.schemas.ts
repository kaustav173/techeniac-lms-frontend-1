import { z } from 'zod';

import { createTrimmedStringSchema, emailSchema, passwordSchema } from './common.schemas';

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: (issue) => (issue.input === undefined ? 'Password is required' : undefined) })
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string({
      error: (issue) => (issue.input === undefined ? 'Please confirm your password' : undefined),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({
        error: (issue) => (issue.input === undefined ? 'Current password is required' : undefined),
      })
      .min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string({
      error: (issue) =>
        issue.input === undefined ? 'Please confirm your new password' : undefined,
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  name: createTrimmedStringSchema('Name', 2, 100),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
