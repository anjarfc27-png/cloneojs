/**
 * API Keys Server Actions - Create
 * 
 * Server Actions for creating API keys.
 */

'use server'

import { randomBytes } from 'crypto'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { apiKeyCreateSchema } from '@/lib/validators/api-keys'
import { revalidatePath } from 'next/cache'
import { ServerActionAuthOptions } from '@/lib/admin/types'

/**
 * Create a new API key
 */
export async function createApiKey(values: {
  key_name: string
  permissions?: Record<string, any>
  expires_at?: string | null
  enabled?: boolean
}, options: ServerActionAuthOptions = {}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
        full_key: null,
      }
    }

    // Validate input
    const validatedData = apiKeyCreateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Generate API key
    const apiKey = `ojs_${randomBytes(32).toString('hex')}`

    // Create API key
    const { data: newApiKey, error } = await client
      .from('api_keys')
      .insert({
        key_name: validatedData.key_name,
        api_key: apiKey,
        user_id: authCheck.user.id,
        permissions: validatedData.permissions || {},
        expires_at: validatedData.expires_at || null,
        enabled: validatedData.enabled !== undefined ? validatedData.enabled : true,
      })
      .select()
      .single()

    if (error) {
      console.error('[createApiKey] Error creating API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to create API key',
        data: null,
        full_key: null,
      }
    }

    // Log activity
    await auditLog({
      action: 'api_key_created',
      entity_type: 'api_key',
      entity_id: newApiKey.id,
      details: {
        key_name: validatedData.key_name,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/api-keys')

    // Return full key only on creation (user needs to copy it)
    return {
      success: true,
      data: {
        ...newApiKey,
        api_key: `${newApiKey.api_key.substring(0, 8)}...`, // Mask for response
      },
      full_key: apiKey, // Return full key for user to copy
    }
  } catch (error: any) {
    console.error('[createApiKey] Unexpected error:', error)
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
        data: null,
        full_key: null,
      }
    }
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
      full_key: null,
    }
  }
}

