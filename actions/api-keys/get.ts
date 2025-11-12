/**
 * API Keys Server Actions - Get
 * 
 * Server Actions for retrieving API keys.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface ApiKey {
  id: string
  key_name: string
  api_key: string
  user_id: string
  permissions: Record<string, any>
  last_used?: string | null
  expires_at?: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all API keys
 */
export async function getApiKeys(options: ServerActionAuthOptions = {}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get all API keys
    const { data: apiKeys, error } = await client
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getApiKeys] Error fetching API keys:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch API keys',
        data: null,
      }
    }

    // Mask API keys for security (only show first 8 characters)
    const sanitizedKeys: ApiKey[] = (apiKeys || []).map(key => ({
      ...key,
      api_key: key.api_key ? `${key.api_key.substring(0, 8)}...` : '',
    }))

    return {
      success: true,
      data: sanitizedKeys,
    }
  } catch (error: any) {
    console.error('[getApiKeys] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get single API key by ID
 */
export async function getApiKeyById(id: string, options: ServerActionAuthOptions = {}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get API key
    const { data: apiKey, error } = await client
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[getApiKeyById] Error fetching API key:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch API key',
        data: null,
      }
    }

    // Mask API key for security
    const sanitizedKey: ApiKey = {
      ...apiKey,
      api_key: apiKey.api_key ? `${apiKey.api_key.substring(0, 8)}...` : '',
    }

    return {
      success: true,
      data: sanitizedKey,
    }
  } catch (error: any) {
    console.error('[getApiKeyById] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

