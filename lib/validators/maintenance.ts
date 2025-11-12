/**
 * Maintenance Validators
 * 
 * Zod schemas for validating maintenance task data
 */

import { z } from 'zod'

/**
 * Maintenance task run schema
 */
export const maintenanceTaskRunSchema = z.object({
  task_id: z.enum(['clear_cache', 'optimize_database', 'cleanup_old_data', 'rebuild_indexes'], {
    errorMap: () => ({ message: 'Invalid task_id' }),
  }),
})

export type MaintenanceTaskRunInput = z.infer<typeof maintenanceTaskRunSchema>

