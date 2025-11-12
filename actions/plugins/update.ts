/**
 * Plugins Server Actions - Update
 * 
 * Server Actions for updating plugins.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { pluginUpdateSchema } from '@/lib/validators/plugins'
import { revalidatePath } from 'next/cache'
import { ServerActionAuthOptions } from '@/lib/admin/types'

/**
 * Update plugin (enable/disable and/or settings)
 */
export async function updatePlugin(
  pluginName: string,
  values: {
    journal_id?: string | null
    enabled?: boolean
    settings?: Array<{
      setting_name: string
      setting_value: string | number | boolean
      setting_type?: string
    }>
  },
  options: ServerActionAuthOptions = {},
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const validatedData = pluginUpdateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Update enabled setting if provided
    if (validatedData.enabled !== undefined) {
      const { error: enabledError } = await client
        .from('plugin_settings')
        .upsert(
          {
            journal_id: validatedData.journal_id || null,
            plugin_name: pluginName,
            setting_name: 'enabled',
            setting_value: validatedData.enabled ? 'true' : 'false',
            setting_type: 'boolean',
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'journal_id,plugin_name,setting_name',
          }
        )

      if (enabledError) {
        console.error('[updatePlugin] Error updating plugin enabled status:', enabledError)
        return {
          success: false,
          error: enabledError.message || 'Failed to update plugin status',
          data: null,
        }
      }
    }

    // Update other settings if provided
    if (validatedData.settings && Array.isArray(validatedData.settings) && validatedData.settings.length > 0) {
      const settingsToUpsert = validatedData.settings.map((setting) => ({
        journal_id: validatedData.journal_id || null,
        plugin_name: pluginName,
        setting_name: setting.setting_name,
        setting_value: setting.setting_value?.toString() || '',
        setting_type: setting.setting_type || 'string',
        updated_at: new Date().toISOString(),
      }))

      const { error: settingsError } = await client
        .from('plugin_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'journal_id,plugin_name,setting_name',
        })

      if (settingsError) {
        console.error('[updatePlugin] Error updating plugin settings:', settingsError)
        return {
          success: false,
          error: settingsError.message || 'Failed to update plugin settings',
          data: null,
        }
      }
    }

    // Log activity
    await auditLog({
      action: 'plugin_settings_updated',
      entity_type: 'plugin',
      entity_id: null,
      details: {
        plugin_name: pluginName,
        journal_id: validatedData.journal_id || null,
        enabled: validatedData.enabled,
        settings_updated: validatedData.settings?.length || 0,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/plugins')

    return {
      success: true,
      data: {
        message: 'Plugin settings updated successfully',
      },
    }
  } catch (error: any) {
    console.error('[updatePlugin] Unexpected error:', error)
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

/**
 * Create or update plugin settings (bulk upsert)
 */
export async function createPluginSettings(
  values: {
  plugin_name: string
  journal_id?: string | null
  settings: Array<{
    setting_name: string
    setting_value: string | number | boolean
    setting_type?: string
  }>
},
  options: ServerActionAuthOptions = {},
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const { plugin_name, journal_id, settings } = values

    if (!plugin_name) {
      return {
        success: false,
        error: 'Plugin name is required',
        data: null,
      }
    }

    if (!settings || !Array.isArray(settings) || settings.length === 0) {
      return {
        success: false,
        error: 'Settings array is required and must not be empty',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Upsert plugin settings
    const settingsToUpsert = settings.map((setting) => ({
      journal_id: journal_id || null,
      plugin_name,
      setting_name: setting.setting_name,
      setting_value: setting.setting_value?.toString() || '',
      setting_type: setting.setting_type || 'string',
      updated_at: new Date().toISOString(),
    }))

    const { error: upsertError } = await client
      .from('plugin_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'journal_id,plugin_name,setting_name',
      })

    if (upsertError) {
      console.error('[createPluginSettings] Error upserting plugin settings:', upsertError)
      return {
        success: false,
        error: upsertError.message || 'Failed to save plugin settings',
        data: null,
      }
    }

    // Log activity
    await auditLog({
      action: 'plugin_settings_updated',
      entity_type: 'plugin',
      entity_id: null,
      details: {
        plugin_name,
        journal_id: journal_id || null,
        settings_count: settings.length,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/plugins')

    return {
      success: true,
      data: {
        message: 'Plugin settings saved successfully',
      },
    }
  } catch (error: any) {
    console.error('[createPluginSettings] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

