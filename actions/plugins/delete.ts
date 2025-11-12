/**
 * Plugins Server Actions - Delete
 * 
 * Server Actions for deleting plugins.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'

/**
 * Delete plugin (remove all settings)
 */
export async function deletePlugin(pluginName: string, journalId?: string | null) {
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

    // Build query
    let query = client.from('plugin_settings').delete().eq('plugin_name', pluginName)

    if (journalId) {
      query = query.eq('journal_id', journalId)
    } else {
      query = query.is('journal_id', null)
    }

    const { error } = await query

    if (error) {
      console.error('[deletePlugin] Error deleting plugin settings:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete plugin',
      }
    }

    // Log activity
    await auditLog({
      action: 'plugin_deleted',
      entity_type: 'plugin',
      entity_id: null,
      details: {
        plugin_name: pluginName,
        journal_id: journalId || null,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/plugins')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[deletePlugin] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

