/**
 * Plugins Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Settings, Power, Trash2, Edit } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getPlugins, Plugin, PluginSetting } from '@/actions/plugins/get'
import { updatePlugin } from '@/actions/plugins/update'
import { deletePlugin } from '@/actions/plugins/delete'

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [availablePlugins, setAvailablePlugins] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchPlugins()
  }, [])

  const fetchPlugins = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getPlugins()

      if (!result.success) {
        setError(result.error || 'Failed to fetch plugins')
        return
      }

      if (result.data) {
        setPlugins(result.data.plugins || [])
        setAvailablePlugins(result.data.available_plugins || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch plugins')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (plugin: Plugin) => {
    startTransition(async () => {
      try {
        const result = await updatePlugin(plugin.plugin_name, {
          journal_id: plugin.journal_id || null,
          enabled: !plugin.enabled,
        })

        if (!result.success) {
          setError(result.error || 'Failed to update plugin')
          return
        }

        fetchPlugins()
      } catch (err: any) {
        setError(err.message || 'Failed to update plugin')
      }
    })
  }

  const handleDelete = async (plugin: Plugin) => {
    if (!confirm(`Are you sure you want to delete "${plugin.plugin_name}"? All settings will be removed.`)) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deletePlugin(plugin.plugin_name, plugin.journal_id || null)

        if (!result.success) {
          setError(result.error || 'Failed to delete plugin')
          return
        }

        fetchPlugins()
      } catch (err: any) {
        setError(err.message || 'Failed to delete plugin')
      }
    })
  }

  const handleConfigure = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Plugins"
          description="Manage system plugins"
        />
        <ContentCard>
          <LoadingSpinner message="Loading plugins..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plugins"
        description="Manage system plugins"
      />

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Installed Plugins</h2>
          <p className="text-sm text-gray-600">Manage plugin settings and configurations</p>
        </div>

        {plugins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No plugins found. Plugins will appear here once they are installed and configured.
          </div>
        ) : (
          <div className="space-y-4">
            {plugins.map((plugin, index) => (
              <div
                key={`${plugin.plugin_name}_${plugin.journal_id || 'site'}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">{plugin.plugin_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        plugin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plugin.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                        {plugin.journal_name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Settings: {plugin.settings.length} configuration(s)</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleConfigure(plugin)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Configure"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(plugin)}
                      disabled={isPending}
                      className={`p-2 rounded-md ${
                        plugin.enabled
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={plugin.enabled ? 'Disable' : 'Enable'}
                    >
                      <Power className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plugin)}
                      disabled={isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {plugin.settings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Settings</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {plugin.settings.slice(0, 6).map((setting) => (
                        <div
                          key={setting.id}
                          className="text-xs p-2 bg-gray-50 rounded"
                        >
                          <div className="font-medium text-gray-700">{setting.setting_name}</div>
                          <div className="text-gray-500 truncate">{setting.setting_value}</div>
                        </div>
                      ))}
                      {plugin.settings.length > 6 && (
                        <div className="text-xs p-2 bg-gray-50 rounded flex items-center justify-center text-gray-500">
                          +{plugin.settings.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      {selectedPlugin && (
        <PluginSettingsModal
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onSuccess={() => {
            setSelectedPlugin(null)
            fetchPlugins()
          }}
        />
      )}
    </div>
  )
}

interface PluginSettingsModalProps {
  plugin: Plugin
  onClose: () => void
  onSuccess: () => void
}

function PluginSettingsModal({ plugin, onClose, onSuccess }: PluginSettingsModalProps) {
  const [settings, setSettings] = useState(plugin.settings)
  const [enabled, setEnabled] = useState(plugin.enabled)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)

    startTransition(async () => {
      try {
        const result = await updatePlugin(plugin.plugin_name, {
          journal_id: plugin.journal_id || null,
          enabled,
          settings: settings.map((s) => ({
            setting_name: s.setting_name,
            setting_value: s.setting_value,
            setting_type: s.setting_type,
          })),
        })

        if (!result.success) {
          setError(result.error || 'Failed to save plugin settings')
          if (result.details) {
            console.error('Validation errors:', result.details)
          }
          return
        }

        onSuccess()
      } catch (err: any) {
        setError(err.message || 'Failed to save plugin settings')
      }
    })
  }

  const updateSetting = (index: number, value: string) => {
    const newSettings = [...settings]
    newSettings[index] = {
      ...newSettings[index],
      setting_value: value,
    }
    setSettings(newSettings)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Configure Plugin: {plugin.plugin_name}
        </h2>

        {error && <ErrorAlert message={error} />}

        <div className="space-y-4">
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Plugin Settings</h3>
            <div className="space-y-3">
              {settings.map((setting, index) => (
                <div key={setting.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {setting.setting_name}
                  </label>
                  {setting.setting_type === 'boolean' ? (
                    <select
                      value={setting.setting_value}
                      onChange={(e) => updateSetting(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : setting.setting_type === 'number' ? (
                    <input
                      type="number"
                      value={setting.setting_value}
                      onChange={(e) => updateSetting(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    />
                  ) : (
                    <input
                      type="text"
                      value={setting.setting_value}
                      onChange={(e) => updateSetting(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


