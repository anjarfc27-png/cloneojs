/**
 * Email Templates Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import ContentCard from '@/components/shared/ContentCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorAlert from '@/components/shared/ErrorAlert'
import { Mail, Edit, Save, X } from 'lucide-react'
import { getEmailTemplates, EmailTemplate } from '@/actions/email-templates/get'
import { updateEmailTemplate } from '@/actions/email-templates/update'

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [editForm, setEditForm] = useState({ subject: '', body: '', enabled: true })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getEmailTemplates()

      if (!result.success) {
        setError(result.error || 'Failed to fetch email templates')
        return
      }

      if (result.data) {
        setTemplates(result.data.templates || [])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setEditForm({
      subject: template.subject || '',
      body: template.body || '',
      enabled: template.enabled,
    })
  }

  const handleCancel = () => {
    setEditingTemplate(null)
    setEditForm({ subject: '', body: '', enabled: true })
  }

  const handleSave = async () => {
    if (!editingTemplate) return

    startTransition(async () => {
      try {
        setError(null)

        const result = await updateEmailTemplate({
          id: editingTemplate.id,
          subject: editForm.subject,
          body: editForm.body,
          enabled: editForm.enabled,
        })

        if (!result.success) {
          setError(result.error || 'Failed to save template')
          if (result.details) {
            console.error('Validation errors:', result.details)
          }
          return
        }

        // Update local state
        if (result.data?.template) {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === editingTemplate.id
                ? { ...t, ...result.data!.template }
                : t
            )
          )
        }

        setEditingTemplate(null)
        setEditForm({ subject: '', body: '', enabled: true })
      } catch (err: any) {
        setError(err.message || 'Failed to save template')
      }
    })
  }

  if (loading || isPending) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
          <p className="text-gray-600">Manage email templates</p>
        </div>
        <ContentCard>
          <LoadingSpinner message="Loading email templates..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
        <p className="text-gray-600">Manage email templates for system notifications</p>
      </div>

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        <div className="space-y-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500">{template.key}</p>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      template.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-[#0056A1] hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingTemplate?.id === template.id ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(e) =>
                        setEditForm({ ...editForm, subject: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Body
                    </label>
                    <textarea
                      value={editForm.body}
                      onChange={(e) =>
                        setEditForm({ ...editForm, body: e.target.value })
                      }
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={(e) =>
                          setEditForm({ ...editForm, enabled: e.target.checked })
                        }
                        disabled={!template.can_disable}
                        className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                      />
                      <span className="text-sm text-gray-700">Enabled</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isPending ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subject:</label>
                    <p className="text-sm text-gray-900 mt-1">{template.subject || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Body:</label>
                    <pre className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded border overflow-auto max-h-40">
                      {template.body || '-'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ContentCard>
    </div>
  )
}


