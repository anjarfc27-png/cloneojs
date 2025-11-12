'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import Tabs from '@/components/shared/Tabs'
import { getSiteSettings } from '@/actions/site-settings/get'
import { updateSiteSettingsBulk } from '@/actions/site-settings/update'
import { useAdminAuth } from '@/components/admin/AdminAuthProvider'

interface SiteSetting {
  id: string
  setting_name: string
  setting_value: string
  setting_type: string
  setting_group: string
  description?: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'security' | 'appearance' | 'localization'>('general')
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { getAccessToken } = useAdminAuth()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const accessToken = await getAccessToken()
      const result = await getSiteSettings({ accessToken })
      
      if (!result.success) {
        setError(result.error || 'Failed to fetch settings')
        return
      }

      // Convert array to object for easier access
      const settingsObj: Record<string, SiteSetting> = {}
      if (result.data?.settings) {
        result.data.settings.forEach((setting: any) => {
          settingsObj[setting.setting_name] = {
            id: setting.id,
            setting_name: setting.setting_name,
            setting_value: setting.setting_value || '',
            setting_type: setting.setting_type || 'string',
            setting_group: setting.setting_group || 'general',
            description: setting.description,
          }
        })
      }
      setSettings(settingsObj)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Get settings for current tab
      const tabSettings = Object.values(settings)
        .filter((s) => s.setting_group === activeTab)
        .map((s) => ({
          setting_name: s.setting_name,
          setting_value: s.setting_value,
          setting_type: s.setting_type,
          setting_group: s.setting_group,
          description: s.description,
        }))

      if (tabSettings.length === 0) {
        setError('No settings to save')
        return
      }

      const accessToken = await getAccessToken()
      const result = await updateSiteSettingsBulk(
        {
          settings: tabSettings,
        },
        { accessToken },
      )

      if (!result.success) {
        setError(result.error || 'Failed to save settings')
        if (result.details) {
          console.error('Validation errors:', result.details)
        }
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // Refresh settings
      await fetchSettings()
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (name: string, value: string) => {
    setSettings((prev) => {
      const existing = prev[name]
      if (!existing) {
        // Create new setting if it doesn't exist
        return {
          ...prev,
          [name]: {
            setting_name: name,
            setting_value: value,
            setting_type: 'string',
            setting_group: activeTab,
          },
        }
      }
      return {
        ...prev,
        [name]: {
          ...existing,
          setting_value: value,
        },
      }
    })
  }

  const getSetting = (name: string, defaultValue: string = '') => {
    return settings[name]?.setting_value || defaultValue
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'email', label: 'Email' },
    { id: 'security', label: 'Security' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'localization', label: 'Localization' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Settings</h1>
          <p className="text-gray-600">Manage site-wide settings</p>
        </div>
        <ContentCard>
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Settings</h1>
          <p className="text-gray-600">Manage site-wide settings and configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <ContentCard>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as any)}
        />

        <div className="mt-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Title
                </label>
                <input
                  type="text"
                  value={getSetting('site_title')}
                  onChange={(e) => updateSetting('site_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  placeholder="OJS Multi-Tenant System"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {settings.site_title?.description || 'The name of your site'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <textarea
                  value={getSetting('site_description')}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  placeholder="Site description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={getSetting('site_contact_name')}
                    onChange={(e) => updateSetting('site_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={getSetting('site_contact_email')}
                    onChange={(e) => updateSetting('site_contact_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={getSetting('maintenance_mode') === 'true'}
                    onChange={(e) => updateSetting('maintenance_mode', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Maintenance Mode
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Enable maintenance mode to restrict site access
                </p>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={getSetting('smtp_enabled') === 'true'}
                    onChange={(e) => updateSetting('smtp_enabled', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Enable SMTP
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Use SMTP server for sending emails
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={getSetting('smtp_host')}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    placeholder="smtp.example.com"
                    disabled={getSetting('smtp_enabled') !== 'true'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={getSetting('smtp_port')}
                    onChange={(e) => updateSetting('smtp_port', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    placeholder="587"
                    disabled={getSetting('smtp_enabled') !== 'true'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={getSetting('smtp_username')}
                    onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    disabled={getSetting('smtp_enabled') !== 'true'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={getSetting('smtp_password')}
                    onChange={(e) => updateSetting('smtp_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    disabled={getSetting('smtp_enabled') !== 'true'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMTP Encryption
                </label>
                <select
                  value={getSetting('smtp_encryption')}
                  onChange={(e) => updateSetting('smtp_encryption', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  disabled={getSetting('smtp_enabled') !== 'true'}
                >
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={getSetting('session_timeout')}
                  onChange={(e) => updateSetting('session_timeout', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  min="300"
                  step="60"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Session timeout in seconds (default: 3600 = 1 hour)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Password Length
                </label>
                <input
                  type="number"
                  value={getSetting('password_min_length')}
                  onChange={(e) => updateSetting('password_min_length', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  min="6"
                  max="128"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Password Requirements</h3>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={getSetting('password_require_uppercase') === 'true'}
                    onChange={(e) => updateSetting('password_require_uppercase', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm text-gray-700">
                    Require uppercase letter
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={getSetting('password_require_lowercase') === 'true'}
                    onChange={(e) => updateSetting('password_require_lowercase', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm text-gray-700">
                    Require lowercase letter
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={getSetting('password_require_number') === 'true'}
                    onChange={(e) => updateSetting('password_require_number', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm text-gray-700">
                    Require number
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={getSetting('password_require_special') === 'true'}
                    onChange={(e) => updateSetting('password_require_special', e.target.checked ? 'true' : 'false')}
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm text-gray-700">
                    Require special character
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={getSetting('theme')}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                >
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={getSetting('logo_url')}
                  onChange={(e) => updateSetting('logo_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  placeholder="https://example.com/logo.png"
                />
                {getSetting('logo_url') && (
                  <div className="mt-2">
                    <img
                      src={getSetting('logo_url')}
                      alt="Logo preview"
                      className="h-16 w-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon URL
                </label>
                <input
                  type="url"
                  value={getSetting('favicon_url')}
                  onChange={(e) => updateSetting('favicon_url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select
                  value={getSetting('default_language', 'id')}
                  onChange={(e) => updateSetting('default_language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                >
                  <option value="id">Indonesian (id)</option>
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                  <option value="pt">Portuguese (pt)</option>
                  <option value="zh">Chinese (zh)</option>
                  <option value="ja">Japanese (ja)</option>
                  <option value="ar">Arabic (ar)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  The default language for the site
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supported Languages
                </label>
                <textarea
                  value={getSetting('supported_languages', '["id", "en"]')}
                  onChange={(e) => updateSetting('supported_languages', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1] font-mono text-sm"
                  placeholder='["id", "en"]'
                />
                <p className="mt-1 text-sm text-gray-500">
                  JSON array of supported language codes (e.g., ["id", "en"])
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select
                  value={getSetting('timezone', 'Asia/Jakarta')}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                >
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                  <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Time zone for the site
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  value={getSetting('date_format', 'YYYY-MM-DD')}
                  onChange={(e) => updateSetting('date_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-15)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (15/01/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (01/15/2024)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (15 Jan 2024)</option>
                  <option value="MMMM DD, YYYY">MMMM DD, YYYY (January 15, 2024)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Format
                </label>
                <select
                  value={getSetting('time_format', '24h')}
                  onChange={(e) => updateSetting('time_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                >
                  <option value="24h">24-hour (14:30)</option>
                  <option value="12h">12-hour (2:30 PM)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  )
}

