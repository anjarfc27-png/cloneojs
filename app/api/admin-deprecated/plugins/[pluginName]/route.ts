import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/plugins/[pluginName]
 * Get plugin settings for a specific plugin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { pluginName: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get('journal_id')

    const query = supabase
      .from('plugin_settings')
      .select('*')
      .eq('plugin_name', params.pluginName)
      .order('setting_name', { ascending: true })

    if (journalId) {
      query.eq('journal_id', journalId)
    } else {
      query.is('journal_id', null)
    }

    const { data: settings, error } = await query

    if (error) {
      console.error('Error fetching plugin settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plugin settings', details: error.message },
        { status: 500 }
      )
    }

    // Check if plugin is enabled
    const enabledSetting = settings?.find(s => s.setting_name === 'enabled')
    const enabled = enabledSetting
      ? enabledSetting.setting_value === 'true' || enabledSetting.setting_value === '1'
      : true

    return NextResponse.json({
      plugin_name: params.pluginName,
      journal_id: journalId || null,
      enabled,
      settings: settings || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/plugins/[pluginName]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/plugins/[pluginName]
 * Update plugin settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { pluginName: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { journal_id, enabled, settings } = body

    // Update enabled setting
    if (enabled !== undefined) {
      const { error: enabledError } = await supabase
        .from('plugin_settings')
        .upsert({
          journal_id: journal_id || null,
          plugin_name: params.pluginName,
          setting_name: 'enabled',
          setting_value: enabled ? 'true' : 'false',
          setting_type: 'boolean',
        }, {
          onConflict: 'journal_id,plugin_name,setting_name',
        })

      if (enabledError) {
        console.error('Error updating plugin enabled status:', enabledError)
        return NextResponse.json(
          { error: 'Failed to update plugin status', details: enabledError.message },
          { status: 500 }
        )
      }
    }

    // Update other settings
    if (settings && Array.isArray(settings)) {
      const settingsToUpsert = settings.map((setting: any) => ({
        journal_id: journal_id || null,
        plugin_name: params.pluginName,
        setting_name: setting.setting_name,
        setting_value: setting.setting_value?.toString() || '',
        setting_type: setting.setting_type || 'string',
      }))

      const { error: settingsError } = await supabase
        .from('plugin_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'journal_id,plugin_name,setting_name',
        })

      if (settingsError) {
        console.error('Error updating plugin settings:', settingsError)
        return NextResponse.json(
          { error: 'Failed to update plugin settings', details: settingsError.message },
          { status: 500 }
        )
      }
    }

    // Log activity
    await logActivity(
      'plugin_settings_updated',
      'plugin',
      null,
      { plugin_name: params.pluginName, journal_id, enabled }
    )

    return NextResponse.json({
      message: 'Plugin settings updated successfully',
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/plugins/[pluginName]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/plugins/[pluginName]
 * Delete plugin (remove all settings)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pluginName: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get('journal_id')

    const query = supabase
      .from('plugin_settings')
      .delete()
      .eq('plugin_name', params.pluginName)

    if (journalId) {
      query.eq('journal_id', journalId)
    } else {
      query.is('journal_id', null)
    }

    const { error } = await query

    if (error) {
      console.error('Error deleting plugin settings:', error)
      return NextResponse.json(
        { error: 'Failed to delete plugin', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'plugin_deleted',
      'plugin',
      null,
      { plugin_name: params.pluginName, journal_id: journalId || null }
    )

    return NextResponse.json({
      message: 'Plugin deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/plugins/[pluginName]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


