/**
 * Activity Logs Validators
 * 
 * Zod schemas for validating activity log queries
 */

import { z } from 'zod'

/**
 * Activity log query schema
 */
export const activityLogQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  action: z.string().optional().nullable(),
  entity_type: z.string().optional().nullable(),
  user_id: z.string().uuid('Invalid user ID').optional().nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
})

/**
 * Activity log cleanup schema
 */
export const activityLogCleanupSchema = z.object({
  days: z.number().int().min(1, 'Days must be at least 1').max(3650, 'Days cannot exceed 10 years').default(90),
})

export type ActivityLogQueryInput = z.infer<typeof activityLogQuerySchema>
export type ActivityLogCleanupInput = z.infer<typeof activityLogCleanupSchema>

