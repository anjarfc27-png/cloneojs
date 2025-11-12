/**
 * Tasks Validators
 * 
 * Zod schemas for validating task data
 */

import { z } from 'zod'

/**
 * Task create schema
 */
export const taskCreateSchema = z.object({
  task_name: z.string().min(1, 'Task name is required').max(255, 'Task name is too long'),
  task_class: z.string().min(1, 'Task class is required').max(255, 'Task class is too long'),
  enabled: z.boolean().optional().default(true),
  run_interval: z.number().int().min(1, 'Run interval must be at least 1 second').optional().default(86400),
})

/**
 * Task update schema
 */
export const taskUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  run_interval: z.number().int().min(1).optional(),
  task_class: z.string().min(1).max(255).optional(),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>

