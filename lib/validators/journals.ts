/**
 * Journals Validators
 * 
 * Zod schemas for validating journal data
 */

import { z } from 'zod'

/**
 * Journal create schema
 */
export const journalCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  path: z.string()
    .min(1, 'Path is required')
    .max(100, 'Path is too long')
    .regex(/^[a-z0-9-]+$/, 'Path can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional().nullable(),
  abbreviation: z.string().max(100, 'Abbreviation is too long').optional().nullable(),
  issn: z.string().regex(/^\d{4}-\d{4}$/, 'ISSN must be in format XXXX-XXXX').optional().nullable(),
  e_issn: z.string().regex(/^\d{4}-\d{4}$/, 'E-ISSN must be in format XXXX-XXXX').optional().nullable(),
  publisher: z.string().max(255, 'Publisher name is too long').optional().nullable(),
  language: z.string().length(2, 'Language must be 2 characters').default('id'),
  contact_email: z.string().email('Invalid email address').optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  contact_name: z.string().max(255, 'Contact name is too long').optional().nullable(),
  journal_manager_id: z.string().uuid('Invalid user ID').optional().nullable(),
  is_active: z.boolean().default(true),
})

/**
 * Journal update schema
 */
export const journalUpdateSchema = journalCreateSchema.partial().extend({
  id: z.string().uuid('Invalid journal ID'),
})

/**
 * Journal status update schema
 */
export const journalStatusSchema = z.object({
  id: z.string().uuid('Invalid journal ID'),
  status: z.enum(['active', 'suspended', 'archived']),
})

export type JournalCreateInput = z.infer<typeof journalCreateSchema>
export type JournalUpdateInput = z.infer<typeof journalUpdateSchema>
export type JournalStatusInput = z.infer<typeof journalStatusSchema>



