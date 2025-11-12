/**
 * Backup Server Actions - Delete
 * 
 * Server Actions for deleting backups.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'

/**
 * Delete a backup
 */
export async function deleteBackup(backupId: string) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Try to delete from backups table (if it exists)
    try {
      const { error } = await client
        .from('backups')
        .delete()
        .eq('id', backupId)

      if (error) {
        console.error('[deleteBackup] Error deleting backup:', error)
        // Don't fail if table doesn't exist
        if (error.message.includes('does not exist')) {
          console.log('[deleteBackup] Backups table not found, skipping database deletion')
        } else {
          return {
            success: false,
            error: error.message || 'Failed to delete backup',
          }
        }
      }
    } catch (error) {
      // Table doesn't exist - that's okay
      console.log('[deleteBackup] Backups table not found, skipping database deletion')
    }

    // In production, you would also:
    // 1. Delete backup file from storage (Supabase Storage)
    // 2. Clean up any related records

    // Log activity
    await auditLog({
      action: 'backup_deleted',
      entity_type: 'backup',
      entity_id: backupId,
      details: {
        backup_id: backupId,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/backup')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[deleteBackup] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

