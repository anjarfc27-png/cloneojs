/**
 * API Keys Server Actions - Regenerate
 * 
 * Server Actions for regenerating API keys.
 */

'use server'

import { randomBytes } from 'crypto'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'

/**
 * Regenerate an API key
 */
export async function regenerateApiKey(id: string) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
        full_key: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get API key before regeneration for logging
    const { data: apiKey } = await client
      .from('api_keys')
      .select('key_name')
      .eq('id', id)
      .single()

    if (!apiKey) {
      return {
        success: false,
        error: 'API key not found',
        data: null,
        full_key: null,
      }
    }

    // Generate new API key
    const newApiKey = `ojs_${randomBytes(32).toString('hex')}`

    // Update API key
    const { data: updatedApiKey, error } = await client
      .from('api_keys')
      .update({
        api_key: newApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[regenerateApiKey] Error regenerating API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to regenerate API key',
        data: null,
        full_key: null,
      }
    }

    // Log activity
    await auditLog({
      action: 'api_key_regenerated',
      entity_type: 'api_key',
      entity_id: id,
      details: {
        key_name: apiKey.key_name,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/api-keys')

    // Return full key only on regeneration (user needs to copy it)
    return {
      success: true,
      data: {
        ...updatedApiKey,
        api_key: `${updatedApiKey.api_key.substring(0, 8)}...`, // Mask for response
      },
      full_key: newApiKey, // Return full key for user to copy
    }
  } catch (error: any) {
    console.error('[regenerateApiKey] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
      full_key: null,
    }
  }
}

