/**
 * Backup Validators
 * 
 * Zod schemas for validating backup data
 */

import { z } from 'zod'

/**
 * Backup create schema
 */
export const backupCreateSchema = z.object({
  backup_type: z.enum(['full', 'incremental']).default('full'),
  description: z.string().optional(),
})

/**
 * Backup restore schema
 */
export const backupRestoreSchema = z.object({
  backup_id: z.string().uuid(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must confirm the restore operation',
  }),
})

export type BackupCreateInput = z.infer<typeof backupCreateSchema>
export type BackupRestoreInput = z.infer<typeof backupRestoreSchema>

