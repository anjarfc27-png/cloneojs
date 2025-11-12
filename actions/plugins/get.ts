/**
 * Plugins Server Actions - Get
 * 
 * Server Actions for retrieving plugins.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface PluginSetting {
  id: string
  journal_id?: string | null
  plugin_name: string
  setting_name: string
  setting_value: string
  setting_type: string
  created_at: string
  updated_at: string
}

export interface Plugin {
  plugin_name: string
  journal_id?: string | null
  journal_name: string
  enabled: boolean
  settings: PluginSetting[]
}

/**
 * Get all plugins with their settings
 */
export async function getPlugins(options: ServerActionAuthOptions = {}) {
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

    // Get all plugin settings grouped by plugin_name
    const { data: pluginSettings, error } = await client
      .from('plugin_settings')
      .select('*')
      .order('plugin_name', { ascending: true })
      .order('setting_name', { ascending: true })

    if (error) {
      console.error('[getPlugins] Error fetching plugin settings:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch plugin settings',
        data: null,
      }
    }

    // Group settings by plugin_name and journal_id
    const pluginsMap = new Map<string, Plugin>()
    const journalsMap = new Map<string, string>()

    pluginSettings?.forEach((setting: any) => {
      const key = `${setting.journal_id || 'site'}_${setting.plugin_name}`

      if (!pluginsMap.has(key)) {
        pluginsMap.set(key, {
          plugin_name: setting.plugin_name,
          journal_id: setting.journal_id || null,
          journal_name: 'Site-wide', // Will be populated if journal_id exists
          settings: [],
          enabled: true, // Default to enabled
        })
      }

      const plugin = pluginsMap.get(key)!
      plugin.settings.push(setting as PluginSetting)

      // Check if plugin is enabled (usually a setting named 'enabled')
      if (setting.setting_name === 'enabled') {
        plugin.enabled = setting.setting_value === 'true' || setting.setting_value === '1'
      }
    })

    // Get journal names for plugins with journal_id
    const journalIds = [
      ...new Set(
        pluginSettings
          ?.filter((s: any) => s.journal_id)
          .map((s: any) => s.journal_id) || []
      ),
    ]

    if (journalIds.length > 0) {
      const { data: journals } = await client
        .from('journals')
        .select('id, title')
        .in('id', journalIds)

      journals?.forEach((journal: any) => {
        journalsMap.set(journal.id, journal.title)
      })
    }

    // Convert map to array and add journal names
    const plugins: Plugin[] = Array.from(pluginsMap.values()).map((plugin) => ({
      ...plugin,
      journal_name: plugin.journal_id ? journalsMap.get(plugin.journal_id) || 'Unknown' : 'Site-wide',
    }))

    // Get list of available plugins (from plugin_settings)
    const availablePlugins = [...new Set(plugins.map((p) => p.plugin_name))]

    return {
      success: true,
      data: {
        plugins,
        available_plugins: availablePlugins,
      },
    }
  } catch (error: any) {
    console.error('[getPlugins] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get plugin by name
 */
export async function getPluginByName(
  pluginName: string,
  journalId?: string | null,
  options: ServerActionAuthOptions = {},
) {
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

    // Build query
    let query = client
      .from('plugin_settings')
      .select('*')
      .eq('plugin_name', pluginName)
      .order('setting_name', { ascending: true })

    if (journalId) {
      query = query.eq('journal_id', journalId)
    } else {
      query = query.is('journal_id', null)
    }

    const { data: settings, error } = await query

    if (error) {
      console.error('[getPluginByName] Error fetching plugin settings:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch plugin settings',
        data: null,
      }
    }

    // Check if plugin is enabled
    const enabledSetting = settings?.find((s: any) => s.setting_name === 'enabled')
    const enabled = enabledSetting
      ? enabledSetting.setting_value === 'true' || enabledSetting.setting_value === '1'
      : true

    return {
      success: true,
      data: {
        plugin_name: pluginName,
        journal_id: journalId || null,
        enabled,
        settings: (settings || []) as PluginSetting[],
      },
    }
  } catch (error: any) {
    console.error('[getPluginByName] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

