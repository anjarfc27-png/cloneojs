/**
 * Languages Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Save, Globe, Check } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getLanguageSettings, LanguageSettings } from '@/actions/languages/get'
import { updateLanguageSettings } from '@/actions/languages/update'

interface Language {
  code: string
  name: string
  native: string
}

export default function LanguagesPage() {
  const [defaultLanguage, setDefaultLanguage] = useState<string>('id')
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['id', 'en'])
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getLanguageSettings()

      if (!result.success) {
        setError(result.error || 'Failed to fetch language settings')
        return
      }

      if (result.data) {
        setDefaultLanguage(result.data.default_language || 'id')
        setSupportedLanguages(result.data.supported_languages || ['id', 'en'])
        setAvailableLanguages(result.data.available_languages || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch language settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    startTransition(async () => {
      try {
        setError(null)
        setSuccess(false)

        const result = await updateLanguageSettings({
          default_language: defaultLanguage,
          supported_languages: supportedLanguages,
        })

        if (!result.success) {
          setError(result.error || 'Failed to save language settings')
          if (result.details) {
            console.error('Validation errors:', result.details)
          }
          return
        }

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err: any) {
        setError(err.message || 'Failed to save language settings')
      }
    })
  }

  const toggleLanguage = (code: string) => {
    if (supportedLanguages.includes(code)) {
      if (supportedLanguages.length > 1) {
        setSupportedLanguages(supportedLanguages.filter(lang => lang !== code))
        // If removing default language, set first supported as default
        if (defaultLanguage === code) {
          const remaining = supportedLanguages.filter(lang => lang !== code)
          if (remaining.length > 0) {
            setDefaultLanguage(remaining[0])
          }
        }
      } else {
        setError('At least one language must be supported')
      }
    } else {
      setSupportedLanguages([...supportedLanguages, code])
    }
  }

  if (loading || isPending) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Languages"
          description="Manage site languages"
        />
        <ContentCard>
          <LoadingSpinner message="Loading language settings..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Languages"
        description="Manage site languages and localization"
      />

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Language settings saved successfully
            </span>
          </div>
        </div>
      )}

      <ContentCard>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Language</h2>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
            >
              {supportedLanguages.map((code) => {
                const lang = availableLanguages.find(l => l.code === code)
                return (
                  <option key={code} value={code}>
                    {lang ? `${lang.name} (${lang.native})` : code}
                  </option>
                )
              })}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              The default language for the site
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supported Languages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableLanguages.map((lang) => {
                const isSupported = supportedLanguages.includes(lang.code)
                const isDefault = defaultLanguage === lang.code

                return (
                  <div
                    key={lang.code}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSupported
                        ? 'border-[#0056A1] bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => toggleLanguage(lang.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{lang.name}</div>
                          <div className="text-sm text-gray-500">{lang.native}</div>
                          <div className="text-xs text-gray-400 mt-1">Code: {lang.code}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isDefault && (
                          <span className="px-2 py-1 bg-[#0056A1] text-white text-xs rounded">
                            Default
                          </span>
                        )}
                        {isSupported && (
                          <Check className="w-5 h-5 text-[#0056A1]" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Click on a language to enable or disable it. At least one language must be supported.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}


