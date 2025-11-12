/**
 * Backup Server Actions - Get
 * 
 * Server Actions for retrieving backup information.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'

export interface Backup {
  id: string
  backup_type: 'full' | 'incremental'
  description?: string | null
  status: 'pending' | 'completed' | 'failed' | 'in_progress'
  file_size?: number | null
  file_url?: string | null
  created_at: string
  created_by?: string | null
}

export interface BackupInfo {
  backups: Backup[]
  last_backup: Backup | null
  next_backup: string | null
  backup_enabled: boolean
  total_backups: number
  total_size: number
}

/**
 * Get backup history and status
 */
export async function getBackups() {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Check if backups table exists
    // For now, we'll use a simple approach - check if table exists
    // If backups table doesn't exist, we'll return empty list
    let backups: Backup[] = []

    try {
      // Try to query backups table (if it exists)
      const { data: backupRecords, error } = await client
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error && backupRecords) {
        backups = backupRecords.map((record: any) => ({
          id: record.id,
          backup_type: record.backup_type || 'full',
          description: record.description || null,
          status: record.status || 'completed',
          file_size: record.file_size || null,
          file_url: record.file_url || null,
          created_at: record.created_at,
          created_by: record.created_by || null,
        }))
      }
    } catch (error) {
      // Table doesn't exist or error - return empty list
      console.log('[getBackups] Backups table not found, returning empty list')
    }

    // Get last backup
    const lastBackup = backups.length > 0 ? backups[0] : null

    // Calculate total size
    const totalSize = backups.reduce((sum, backup) => sum + (backup.file_size || 0), 0)

    const backupInfo: BackupInfo = {
      backups,
      last_backup: lastBackup,
      next_backup: null, // Could be calculated based on schedule
      backup_enabled: true,
      total_backups: backups.length,
      total_size: totalSize,
    }

    return {
      success: true,
      data: backupInfo,
    }
  } catch (error: any) {
    console.error('[getBackups] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

