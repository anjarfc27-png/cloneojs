/**
 * Languages Validators
 * 
 * Zod schemas for validating language settings
 */

import { z } from 'zod'

/**
 * Language settings update schema
 */
export const languageSettingsUpdateSchema = z.object({
  default_language: z.string().length(2, 'Language code must be 2 characters'),
  supported_languages: z.array(z.string().length(2, 'Language code must be 2 characters')).min(1, 'At least one language must be supported'),
})

export type LanguageSettingsUpdateInput = z.infer<typeof languageSettingsUpdateSchema>

/**
 * Available languages list
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
] as const

export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number]

