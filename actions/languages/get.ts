/**
 * Languages Server Actions - Get
 * 
 * Server Actions for retrieving language settings.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { AVAILABLE_LANGUAGES, AvailableLanguage } from '@/lib/validators/languages'

export interface LanguageSettings {
  default_language: string
  supported_languages: string[]
  available_languages: AvailableLanguage[]
}

/**
 * Get language settings
 */
export async function getLanguageSettings() {
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

    // Get language settings from site_settings
    const { data: settings, error } = await client
      .from('site_settings')
      .select('*')
      .in('setting_name', ['default_language', 'supported_languages'])
      .order('setting_name', { ascending: true })

    if (error) {
      console.error('[getLanguageSettings] Error fetching language settings:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Parse settings
    const defaultLanguage = settings?.find(s => s.setting_name === 'default_language')?.setting_value || 'id'
    const supportedLanguagesJson = settings?.find(s => s.setting_name === 'supported_languages')?.setting_value || '["id", "en"]'
    let supportedLanguages: string[] = ['id', 'en']
    
    try {
      if (typeof supportedLanguagesJson === 'string') {
        supportedLanguages = JSON.parse(supportedLanguagesJson)
      } else if (Array.isArray(supportedLanguagesJson)) {
        supportedLanguages = supportedLanguagesJson
      }
    } catch (e) {
      console.error('[getLanguageSettings] Error parsing supported_languages:', e)
      supportedLanguages = ['id', 'en']
    }

    // Ensure default language is in supported languages
    if (!supportedLanguages.includes(defaultLanguage)) {
      supportedLanguages = [defaultLanguage, ...supportedLanguages.filter(lang => lang !== defaultLanguage)]
    }

    const languageSettings: LanguageSettings = {
      default_language: defaultLanguage,
      supported_languages: supportedLanguages,
      available_languages: AVAILABLE_LANGUAGES,
    }

    return {
      success: true,
      data: languageSettings,
    }
  } catch (error: any) {
    console.error('[getLanguageSettings] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

