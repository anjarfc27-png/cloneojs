import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/settings
 * Get all site settings
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('setting_group', { ascending: true })
      .order('setting_name', { ascending: true })

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings', details: error.message },
        { status: 500 }
      )
    }

    // Group settings by group
    const groupedSettings = (settings || []).reduce((acc: Record<string, any[]>, setting: any) => {
      const group = setting.setting_group || 'general'
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(setting)
      return acc
    }, {})

    return NextResponse.json({
      settings: settings || [],
      grouped: groupedSettings,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings
 * Update site settings
 */
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck
    const body = await request.json()

    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings array is required' },
        { status: 400 }
      )
    }

    // Update each setting
    const updates = settings.map((setting: any) => ({
      setting_name: setting.setting_name,
      setting_value: setting.setting_value?.toString() || '',
      setting_type: setting.setting_type || 'string',
      setting_group: setting.setting_group || 'general',
      updated_at: new Date().toISOString(),
    }))

    // Use upsert to update or insert settings
    const { error } = await supabase
      .from('site_settings')
      .upsert(updates, {
        onConflict: 'setting_name',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json(
        { error: 'Failed to update settings', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'settings_updated',
      'settings',
      undefined,
      { settings_count: settings.length }
    )

    return NextResponse.json({
      message: 'Settings updated successfully',
      updated: updates.length,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/settings
 * Create or update a single setting
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck
    const body = await request.json()

    const { setting_name, setting_value, setting_type, setting_group, description } = body

    if (!setting_name) {
      return NextResponse.json(
        { error: 'setting_name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        setting_name,
        setting_value: setting_value?.toString() || '',
        setting_type: setting_type || 'string',
        setting_group: setting_group || 'general',
        description: description || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_name',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating setting:', error)
      return NextResponse.json(
        { error: 'Failed to create/update setting', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'setting_updated',
      'settings',
      data.id,
      { setting_name, setting_value: setting_value?.toString().substring(0, 100) }
    )

    return NextResponse.json({
      message: 'Setting updated successfully',
      setting: data,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

