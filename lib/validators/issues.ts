/**
 * Issues Validators
 * 
 * Zod schemas for validating issue data
 */

import { z } from 'zod'

/**
 * Issue create schema
 */
export const issueCreateSchema = z.object({
  journal_id: z.string().uuid('Invalid journal ID'),
  volume: z.number().int().positive().nullable().optional(),
  number: z.string().max(50).nullable().optional(),
  year: z.number().int().min(1900).max(2100),
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  published_date: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).default('draft'),
  access_status: z.enum(['open', 'subscription', 'restricted']).default('open'),
  cover_image_url: z.string().url().nullable().optional(),
  cover_image_alt_text: z.string().max(255).nullable().optional(),
})

/**
 * Issue update schema
 */
export const issueUpdateSchema = z.object({
  id: z.string().uuid('Invalid issue ID'),
  journal_id: z.string().uuid('Invalid journal ID').optional(),
  volume: z.number().int().positive().nullable().optional(),
  number: z.string().max(50).nullable().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  published_date: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  access_status: z.enum(['open', 'subscription', 'restricted']).optional(),
  cover_image_url: z.string().url().nullable().optional(),
  cover_image_alt_text: z.string().max(255).nullable().optional(),
})

/**
 * Issue query schema
 */
export const issueQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  status: z.enum(['future', 'back']).default('future'),
  journal_id: z.string().uuid('Invalid journal ID').nullable().optional(),
  search: z.string().optional().nullable(),
})

export type IssueCreateInput = z.infer<typeof issueCreateSchema>
export type IssueUpdateInput = z.infer<typeof issueUpdateSchema>
export type IssueQueryInput = z.infer<typeof issueQuerySchema>

