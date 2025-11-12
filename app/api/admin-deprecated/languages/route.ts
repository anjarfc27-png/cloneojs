import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * GET /api/admin/languages
 * Get language settings
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Get language settings from site_settings
    const { data: settings, error } = await supabase
      .from('site_settings')
      .select('*')
      .in('setting_name', ['default_language', 'supported_languages'])
      .order('setting_name', { ascending: true })

    if (error) {
      console.error('Error fetching language settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch language settings', details: error.message },
        { status: 500 }
      )
    }

    // Parse settings
    const defaultLanguage = settings?.find(s => s.setting_name === 'default_language')?.setting_value || 'id'
    const supportedLanguagesJson = settings?.find(s => s.setting_name === 'supported_languages')?.setting_value || '["id", "en"]'
    let supportedLanguages: string[] = ['id', 'en']
    
    try {
      supportedLanguages = JSON.parse(supportedLanguagesJson)
    } catch (e) {
      console.error('Error parsing supported_languages:', e)
    }

    // Available languages (you can extend this list)
    const availableLanguages = [
      { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
      { code: 'en', name: 'English', native: 'English' },
      { code: 'es', name: 'Spanish', native: 'Español' },
      { code: 'fr', name: 'French', native: 'Français' },
      { code: 'de', name: 'German', native: 'Deutsch' },
      { code: 'pt', name: 'Portuguese', native: 'Português' },
      { code: 'zh', name: 'Chinese', native: '中文' },
      { code: 'ja', name: 'Japanese', native: '日本語' },
      { code: 'ar', name: 'Arabic', native: 'العربية' },
    ]

    return NextResponse.json({
      default_language: defaultLanguage,
      supported_languages: supportedLanguages,
      available_languages: availableLanguages,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/languages:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/languages
 * Update language settings
 */
export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const { default_language, supported_languages } = body

    if (!default_language) {
      return NextResponse.json(
        { error: 'default_language is required' },
        { status: 400 }
      )
    }

    if (!supported_languages || !Array.isArray(supported_languages)) {
      return NextResponse.json(
        { error: 'supported_languages must be an array' },
        { status: 400 }
      )
    }

    // Update default language
    const { error: defaultError } = await supabase
      .from('site_settings')
      .upsert({
        setting_name: 'default_language',
        setting_value: default_language,
        setting_type: 'string',
        setting_group: 'localization',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_name',
      })

    if (defaultError) {
      console.error('Error updating default language:', defaultError)
      return NextResponse.json(
        { error: 'Failed to update default language', details: defaultError.message },
        { status: 500 }
      )
    }

    // Update supported languages
    const { error: supportedError } = await supabase
      .from('site_settings')
      .upsert({
        setting_name: 'supported_languages',
        setting_value: JSON.stringify(supported_languages),
        setting_type: 'json',
        setting_group: 'localization',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_name',
      })

    if (supportedError) {
      console.error('Error updating supported languages:', supportedError)
      return NextResponse.json(
        { error: 'Failed to update supported languages', details: supportedError.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'language_settings_updated',
      'settings',
      null,
      { default_language, supported_languages }
    )

    return NextResponse.json({
      message: 'Language settings updated successfully',
      default_language,
      supported_languages,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/languages:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


