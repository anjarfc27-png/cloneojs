/**
 * Email Templates Validators
 * 
 * Zod schemas for validating email template data
 */

import { z } from 'zod'

/**
 * Email template update schema
 */
export const emailTemplateUpdateSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
  subject: z.string().optional(),
  body: z.string().optional(),
  enabled: z.boolean().optional(),
})

/**
 * Email template status update schema
 */
export const emailTemplateStatusSchema = z.object({
  id: z.string().uuid('Invalid template ID'),
  enabled: z.boolean(),
})

export type EmailTemplateUpdateInput = z.infer<typeof emailTemplateUpdateSchema>
export type EmailTemplateStatusInput = z.infer<typeof emailTemplateStatusSchema>

