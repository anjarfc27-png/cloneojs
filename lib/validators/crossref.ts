/**
 * Crossref Validators
 * 
 * Zod schemas for validating Crossref/DOI data
 */

import { z } from 'zod'

/**
 * DOI registration schema
 */
export const doiRegistrationSchema = z.object({
  article_id: z.string().uuid('Invalid article ID'),
  doi: z.string().optional(),
})

/**
 * DOI status query schema
 */
export const doiStatusQuerySchema = z.object({
  status: z.enum(['all', 'registered', 'pending', 'failed']).optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
})

export type DOIRegistrationInput = z.infer<typeof doiRegistrationSchema>
export type DOIStatusQueryInput = z.infer<typeof doiStatusQuerySchema>

