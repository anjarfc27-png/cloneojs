/**
 * API Keys Validators
 * 
 * Zod schemas for validating API key data
 */

import { z } from 'zod'

/**
 * API key create schema
 */
export const apiKeyCreateSchema = z.object({
  key_name: z.string().min(1, 'Key name is required').max(255, 'Key name is too long'),
  permissions: z.record(z.any()).optional().default({}),
  expires_at: z.string().nullable().optional(),
  enabled: z.boolean().optional().default(true),
})

/**
 * API key update schema
 */
export const apiKeyUpdateSchema = z.object({
  key_name: z.string().min(1).max(255).optional(),
  permissions: z.record(z.any()).optional(),
  expires_at: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
})

export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
export type ApiKeyUpdateInput = z.infer<typeof apiKeyUpdateSchema>

