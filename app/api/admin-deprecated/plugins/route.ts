import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/plugins
 * Get all plugins and their settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get all plugin settings grouped by plugin_name
    const { data: pluginSettings, error } = await supabase
      .from('plugin_settings')
      .select('*')
      .order('plugin_name', { ascending: true })
      .order('setting_name', { ascending: true })

    if (error) {
      console.error('Error fetching plugin settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plugin settings', details: error.message },
        { status: 500 }
      )
    }

    // Group settings by plugin_name
    const pluginsMap = new Map<string, any>()
    const journalsMap = new Map<string, any>()

    pluginSettings?.forEach((setting: any) => {
      const key = `${setting.journal_id || 'site'}_${setting.plugin_name}`
      
      if (!pluginsMap.has(key)) {
        pluginsMap.set(key, {
          plugin_name: setting.plugin_name,
          journal_id: setting.journal_id || null,
          journal_name: null, // Will be populated if journal_id exists
          settings: [],
          enabled: true, // Default to enabled
        })
      }

      const plugin = pluginsMap.get(key)
      plugin.settings.push(setting)

      // Check if plugin is enabled (usually a setting named 'enabled')
      if (setting.setting_name === 'enabled') {
        plugin.enabled = setting.setting_value === 'true' || setting.setting_value === '1'
      }
    })

    // Get journal names for plugins with journal_id
    const journalIds = [...new Set(
      pluginSettings
        ?.filter((s: any) => s.journal_id)
        .map((s: any) => s.journal_id) || []
    )]

    if (journalIds.length > 0) {
      const { data: journals } = await supabase
        .from('journals')
        .select('id, title')
        .in('id', journalIds)

      journals?.forEach((journal: any) => {
        journalsMap.set(journal.id, journal.title)
      })
    }

    // Convert map to array and add journal names
    const plugins = Array.from(pluginsMap.values()).map(plugin => ({
      ...plugin,
      journal_name: plugin.journal_id ? journalsMap.get(plugin.journal_id) : 'Site-wide',
    }))

    // Get list of available plugins (from plugin_settings or hardcoded list)
    // For now, we'll use the plugins found in settings
    const availablePlugins = [...new Set(plugins.map(p => p.plugin_name))]

    return NextResponse.json({
      plugins,
      available_plugins: availablePlugins,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/plugins:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/plugins
 * Create or update plugin settings
 */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { plugin_name, journal_id, settings } = body

    if (!plugin_name) {
      return NextResponse.json(
        { error: 'plugin_name is required' },
        { status: 400 }
      )
    }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'settings array is required' },
        { status: 400 }
      )
    }

    // Upsert plugin settings
    const settingsToUpsert = settings.map((setting: any) => ({
      journal_id: journal_id || null,
      plugin_name,
      setting_name: setting.setting_name,
      setting_value: setting.setting_value?.toString() || '',
      setting_type: setting.setting_type || 'string',
    }))

    const { error: upsertError } = await supabase
      .from('plugin_settings')
      .upsert(settingsToUpsert, {
        onConflict: 'journal_id,plugin_name,setting_name',
      })

    if (upsertError) {
      console.error('Error upserting plugin settings:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save plugin settings', details: upsertError.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'plugin_settings_updated',
      'plugin',
      null,
      { plugin_name, journal_id }
    )

    return NextResponse.json({
      message: 'Plugin settings saved successfully',
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/plugins:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


