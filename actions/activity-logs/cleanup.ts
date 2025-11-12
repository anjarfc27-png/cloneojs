/**
 * Activity Logs Server Actions - Cleanup
 * 
 * Server Actions for cleaning up old activity logs.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { activityLogCleanupSchema } from '@/lib/validators/activity-logs'
import { z } from 'zod'

/**
 * Cleanup old activity logs
 */
export async function cleanupActivityLogs(values: z.infer<typeof activityLogCleanupSchema>) {
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

    // Validate input
    const data = activityLogCleanupSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - data.days)

    // Get count of logs to be deleted (for audit log)
    const { count: logsToDelete } = await client
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString())

    // Delete old logs
    const { data: deletedLogs, error } = await client
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select()

    if (error) {
      console.error('[cleanupActivityLogs] Error deleting activity logs:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('cleanup_activity_logs', {
      days: data.days,
      cutoff_date: cutoffDate.toISOString(),
      deleted_count: deletedLogs?.length || 0,
    })

    // Revalidate paths
    revalidatePath('/admin/activity-logs')
    revalidatePath('/admin/activity-log')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        deleted: deletedLogs?.length || 0,
        cutoff_date: cutoffDate.toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[cleanupActivityLogs] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
        data: null,
      }
    }

    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

