/**
 * Languages Server Actions - Update
 * 
 * Server Actions for updating language settings.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logSettingsAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { languageSettingsUpdateSchema } from '@/lib/validators/languages'

/**
 * Update language settings
 */
export async function updateLanguageSettings(values: z.infer<typeof languageSettingsUpdateSchema>) {
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

    // Validate input
    const data = languageSettingsUpdateSchema.parse(values)

    // Ensure default language is in supported languages
    if (!data.supported_languages.includes(data.default_language)) {
      return {
        success: false,
        error: 'Default language must be in supported languages',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get existing settings for audit log
    const { data: existingSettings } = await client
      .from('site_settings')
      .select('*')
      .in('setting_name', ['default_language', 'supported_languages'])

    const existingDefaultLanguage = existingSettings?.find(s => s.setting_name === 'default_language')?.setting_value || 'id'
    const existingSupportedLanguagesJson = existingSettings?.find(s => s.setting_name === 'supported_languages')?.setting_value || '["id", "en"]'
    let existingSupportedLanguages: string[] = ['id', 'en']
    
    try {
      if (typeof existingSupportedLanguagesJson === 'string') {
        existingSupportedLanguages = JSON.parse(existingSupportedLanguagesJson)
      } else if (Array.isArray(existingSupportedLanguagesJson)) {
        existingSupportedLanguages = existingSupportedLanguagesJson
      }
    } catch (e) {
      // Ignore parsing error
    }

    // Update default language
    const { error: defaultError } = await client
      .from('site_settings')
      .upsert({
        setting_name: 'default_language',
        setting_value: data.default_language,
        setting_type: 'string',
        setting_group: 'localization',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_name',
      })

    if (defaultError) {
      console.error('[updateLanguageSettings] Error updating default language:', defaultError)
      return {
        success: false,
        error: defaultError.message,
        data: null,
      }
    }

    // Update supported languages
    const { error: supportedError } = await client
      .from('site_settings')
      .upsert({
        setting_name: 'supported_languages',
        setting_value: JSON.stringify(data.supported_languages),
        setting_type: 'json',
        setting_group: 'localization',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'setting_name',
      })

    if (supportedError) {
      console.error('[updateLanguageSettings] Error updating supported languages:', supportedError)
      return {
        success: false,
        error: supportedError.message,
        data: null,
      }
    }

    // Log audit event
    await logSettingsAction('update_language_settings', {
      before: {
        default_language: existingDefaultLanguage,
        supported_languages: existingSupportedLanguages,
      },
      after: {
        default_language: data.default_language,
        supported_languages: data.supported_languages,
      },
    })

    // Revalidate paths
    revalidatePath('/admin/languages')
    revalidatePath('/admin/dashboard')
    revalidatePath('/') // Home page (language affects all pages)

    return {
      success: true,
      data: {
        default_language: data.default_language,
        supported_languages: data.supported_languages,
      },
    }
  } catch (error: any) {
    console.error('[updateLanguageSettings] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
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

