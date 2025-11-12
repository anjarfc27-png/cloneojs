/**
 * Statistics Validators
 * 
 * Zod schemas for validating statistics queries
 */

import { z } from 'zod'

/**
 * Statistics query schema
 */
export const statisticsQuerySchema = z.object({
  period: z.enum(['all', 'day', 'week', 'month', 'year']).default('all'),
})

export type StatisticsQueryInput = z.infer<typeof statisticsQuerySchema>

