/**
 * API Keys Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Edit, Trash2, Copy, RefreshCw, Key, Eye, EyeOff } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getApiKeys, ApiKey } from '@/actions/api-keys/get'
import { createApiKey } from '@/actions/api-keys/create'
import { updateApiKey } from '@/actions/api-keys/update'
import { deleteApiKey } from '@/actions/api-keys/delete'
import { regenerateApiKey } from '@/actions/api-keys/regenerate'

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getApiKeys()

      if (!result.success) {
        setError(result.error || 'Failed to fetch API keys')
        return
      }

      if (result.data) {
        setApiKeys(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch API keys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingKey(null)
    setNewKey(null)
    setIsModalOpen(true)
  }

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key)
    setNewKey(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteApiKey(id)

        if (!result.success) {
          setError(result.error || 'Failed to delete API key')
          return
        }

        fetchApiKeys()
      } catch (err: any) {
        setError(err.message || 'Failed to delete API key')
      }
    })
  }

  const handleRegenerate = async (id: string) => {
    if (!confirm('Are you sure you want to regenerate this API key? The old key will no longer work.')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await regenerateApiKey(id)

        if (!result.success) {
          setError(result.error || 'Failed to regenerate API key')
          return
        }

        if (result.full_key) {
          setNewKey(result.full_key)
        }
        fetchApiKeys()
      } catch (err: any) {
        setError(err.message || 'Failed to regenerate API key')
      }
    })
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    alert('API key copied to clipboard!')
  }

  const toggleShowKey = (id: string) => {
    const newShow = new Set(showKeys)
    if (newShow.has(id)) {
      newShow.delete(id)
    } else {
      newShow.add(id)
    }
    setShowKeys(newShow)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="API Keys"
          description="Manage API keys for system access"
        />
        <ContentCard>
          <LoadingSpinner message="Loading API keys..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage API keys for system access"
      />

      {error && <ErrorAlert message={error} />}

      {newKey && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">New API Key Generated</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Copy this key now. You won't be able to see it again!
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <code className="bg-yellow-100 px-3 py-2 rounded text-sm font-mono">{newKey}</code>
                <button
                  onClick={() => handleCopy(newKey)}
                  className="p-2 text-yellow-800 hover:bg-yellow-100 rounded"
                  title="Copy"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="text-yellow-800 hover:text-yellow-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <ContentCard>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
          <button
            onClick={handleCreate}
            className="flex items-center px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No API keys found. Click "Create API Key" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Key className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{key.key_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {showKeys.has(key.id) ? key.api_key : key.api_key}
                        </code>
                        <button
                          onClick={() => toggleShowKey(key.id)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title={showKeys.has(key.id) ? 'Hide' : 'Show'}
                        >
                          {showKeys.has(key.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(key.api_key)}
                          className="p-1 text-gray-600 hover:text-gray-900"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        key.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {key.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used ? new Date(key.last_used).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(key)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRegenerate(key.id)}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Regenerate
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {isModalOpen && (
        <ApiKeyModal
          key={editingKey?.id || 'new'}
          apiKey={editingKey}
          onClose={() => {
            setIsModalOpen(false)
            setEditingKey(null)
            setNewKey(null)
          }}
          onSuccess={(fullKey?: string) => {
            setIsModalOpen(false)
            setEditingKey(null)
            if (fullKey) {
              setNewKey(fullKey)
            }
            fetchApiKeys()
          }}
        />
      )}
    </div>
  )
}

interface ApiKeyModalProps {
  apiKey: ApiKey | null
  onClose: () => void
  onSuccess: (fullKey?: string) => void
}

function ApiKeyModal({ apiKey, onClose, onSuccess }: ApiKeyModalProps) {
  const [formData, setFormData] = useState({
    key_name: apiKey?.key_name || '',
    permissions: apiKey?.permissions || {},
    expires_at: apiKey?.expires_at ? apiKey.expires_at.split('T')[0] : '',
    enabled: apiKey?.enabled !== undefined ? apiKey.enabled : true,
  })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        if (apiKey) {
          const result = await updateApiKey(apiKey.id, {
            ...formData,
            expires_at: formData.expires_at || null,
          })

          if (!result.success) {
            setError(result.error || 'Failed to update API key')
            if (result.details) {
              console.error('Validation errors:', result.details)
            }
            return
          }

          onSuccess()
        } else {
          const result = await createApiKey({
            ...formData,
            expires_at: formData.expires_at || null,
          })

          if (!result.success) {
            setError(result.error || 'Failed to create API key')
            if (result.details) {
              console.error('Validation errors:', result.details)
            }
            return
          }

          onSuccess(result.full_key || undefined)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to save API key')
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {apiKey ? 'Edit API Key' : 'Create API Key'}
        </h2>

        {error && <ErrorAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.key_name}
              onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              placeholder="My API Key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires At
            </label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
            />
            <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
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
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] disabled:opacity-50"
            >
              {isPending ? 'Saving...' : apiKey ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


