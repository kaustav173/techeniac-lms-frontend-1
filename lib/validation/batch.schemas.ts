import { z } from 'zod';

import { createTrimmedStringSchema, uuidSchema } from './common.schemas';

export const batchStatusEnum = z.enum(['DRAFT', 'LIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']);

export type BatchStatus = z.infer<typeof batchStatusEnum>;

export const ALLOWED_STATUS_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  DRAFT: ['LIVE', 'ARCHIVED'],
  LIVE: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['LIVE', 'COMPLETED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

export const isBatchLocked = (status: BatchStatus): boolean =>
  ALLOWED_STATUS_TRANSITIONS[status].length === 0;

export const createBatchSchema = z
  .object({
    name: createTrimmedStringSchema('Batch name', 3, 100),
    code: z
      .string({ required_error: 'Batch code is required' })
      .trim()
      .min(3, 'Batch code must be at least 3 characters')
      .max(20, 'Batch code must not exceed 20 characters')
      .regex(/^[A-Z0-9-]+$/, 'Batch code must be uppercase alphanumeric and hyphens only')
      .transform((val) => val.toUpperCase()),
    startDate: z
      .string({ required_error: 'Please select start date' })
      .trim()
      .min(1, 'Please select start date'),
    endDate: z
      .string({ required_error: 'Please select end date' })
      .trim()
      .min(1, 'Please select end date'),
    description: z.string().max(5000, 'Description must not exceed 5000 characters').optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      if (Number.isNaN(start) || Number.isNaN(end)) return true;
      return start <= end;
    },
    {
      message: 'Start date must be earlier than or equal to end date',
      path: ['endDate'],
    },
  );

export type CreateBatchFormData = z.infer<typeof createBatchSchema>;

export const changeBatchStatusSchema = z.object({
  newStatus: batchStatusEnum,
  reason: z.string().max(500, 'Reason must not exceed 500 characters').optional(),
});

export type ChangeBatchStatusFormData = z.infer<typeof changeBatchStatusSchema>;

export const transferMenteeSchema = z.object({
  menteeId: uuidSchema,
  targetBatchId: uuidSchema,
  reason: z.string().max(500).optional(),
});

export type TransferMenteeFormData = z.infer<typeof transferMenteeSchema>;
