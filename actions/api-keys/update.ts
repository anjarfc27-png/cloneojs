/**
 * API Keys Server Actions - Update
 * 
 * Server Actions for updating API keys.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { apiKeyUpdateSchema } from '@/lib/validators/api-keys'
import { revalidatePath } from 'next/cache'

/**
 * Update an API key
 */
export async function updateApiKey(
  id: string,
  values: {
    key_name?: string
    permissions?: Record<string, any>
    expires_at?: string | null
    enabled?: boolean
  }
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const validatedData = apiKeyUpdateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.key_name !== undefined) {
      updateData.key_name = validatedData.key_name
    }
    if (validatedData.permissions !== undefined) {
      updateData.permissions = validatedData.permissions
    }
    if (validatedData.expires_at !== undefined) {
      updateData.expires_at = validatedData.expires_at
    }
    if (validatedData.enabled !== undefined) {
      updateData.enabled = validatedData.enabled
    }

    // Update API key
    const { data: updatedApiKey, error } = await client
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[updateApiKey] Error updating API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to update API key',
        data: null,
      }
    }

    // Log activity
    await auditLog({
      action: 'api_key_updated',
      entity_type: 'api_key',
      entity_id: id,
      details: {
        key_name: updatedApiKey.key_name,
        changes: validatedData,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/api-keys')

    // Mask API key for security
    return {
      success: true,
      data: {
        ...updatedApiKey,
        api_key: updatedApiKey.api_key ? `${updatedApiKey.api_key.substring(0, 8)}...` : '',
      },
    }
  } catch (error: any) {
    console.error('[updateApiKey] Unexpected error:', error)
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error',
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

