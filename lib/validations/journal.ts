/**
 * Validation Schemas untuk Journals
 */

import { z } from 'zod'

/**
 * Schema untuk create journal
 */
export const createJournalSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  issn: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'ISSN must be in format XXXX-XXXX')
    .optional()
    .nullable(),
  editor_id: z.string().uuid('Invalid editor ID format').optional().nullable(),
  tenant_id: z.string().uuid('Invalid tenant ID format'),
  is_active: z.boolean().default(true),
})

export type CreateJournalInput = z.infer<typeof createJournalSchema>

/**
 * Schema untuk update journal
 */
export const updateJournalSchema = createJournalSchema
  .partial()
  .extend({
    id: z.string().uuid('Invalid journal ID format'),
  })

export type UpdateJournalInput = z.infer<typeof updateJournalSchema>

