/**
 * API Keys Server Actions - Delete
 * 
 * Server Actions for deleting API keys.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'

/**
 * Delete an API key
 */
export async function deleteApiKey(id: string) {
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

    // Get API key before deletion for logging
    const { data: apiKey } = await client
      .from('api_keys')
      .select('key_name')
      .eq('id', id)
      .single()

    // Delete API key
    const { error } = await client
      .from('api_keys')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteApiKey] Error deleting API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to delete API key',
      }
    }

    // Log activity
    await auditLog({
      action: 'api_key_deleted',
      entity_type: 'api_key',
      entity_id: id,
      details: {
        key_name: apiKey?.key_name || 'Unknown',
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/api-keys')

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('[deleteApiKey] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

