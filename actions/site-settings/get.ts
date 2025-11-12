/**
 * Site Settings Server Actions - Get
 * 
 * Server Actions for retrieving site settings.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * Get all site settings
 */
export async function getSiteSettings() {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Fetch settings
    const { data: settings, error } = await client
      .from('site_settings')
      .select('*')
      .order('setting_group', { ascending: true })
      .order('setting_name', { ascending: true })

    if (error) {
      console.error('[getSiteSettings] Error fetching settings:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
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

    return {
      success: true,
      data: {
        settings: settings || [],
        grouped: groupedSettings,
      },
    }
  } catch (error: any) {
    console.error('[getSiteSettings] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get a single site setting by name
 */
export async function getSiteSetting(settingName: string) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Fetch setting
    const { data: setting, error } = await client
      .from('site_settings')
      .select('*')
      .eq('setting_name', settingName)
      .maybeSingle()

    if (error) {
      console.error('[getSiteSetting] Error fetching setting:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      data: setting,
    }
  } catch (error: any) {
    console.error('[getSiteSetting] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}



