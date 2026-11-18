import { z } from 'zod';

import { createTrimmedStringSchema, emailSchema } from './common.schemas';

export const userRoleEnum = z.enum(['SUPER_ADMIN', 'MENTOR', 'MENTEE']);
export type UserRole = z.infer<typeof userRoleEnum>;

export const userStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);
export type UserStatus = z.infer<typeof userStatusEnum>;

// FR-2.1: Create user with only three fields: name, email and initial role
export const createUserSchema = z.object({
  name: createTrimmedStringSchema('Full name', 2, 100),
  email: emailSchema,
  role: userRoleEnum,
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: createTrimmedStringSchema('Full name', 2, 100),
  email: emailSchema,
  status: userStatusEnum,
});

export type EditUserFormData = z.infer<typeof editUserSchema>;

// FR-2.3: Change role with a mandatory reason (10-500 chars) subject to allowed role transitions
export const changeRoleSchema = z.object({
  newRole: userRoleEnum,
  reason: z
    .string({ error: (issue) => (issue.input === undefined ? 'Reason is required' : undefined) })
    .trim()
    .min(10, 'Reason must be at least 10 characters long')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type ChangeRoleFormData = z.infer<typeof changeRoleSchema>;

// FR-2.4: CSV row schema for bulk import (name, email, role)
export const csvUserRowSchema = z.object({
  name: createTrimmedStringSchema('Name', 2, 100),
  email: emailSchema,
  role: userRoleEnum,
});

export type CsvUserRow = z.infer<typeof csvUserRowSchema>;
