'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Journal } from './JournalTable'

interface Editor {
  id: string
  name: string
  email: string
}

interface JournalFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  journal?: Journal | null
  editors: Editor[]
  onCreate?: (data: any) => Promise<any>
  onUpdate?: (data: any) => Promise<any>
}

export default function JournalFormModal({
  isOpen,
  onClose,
  onSuccess,
  journal,
  editors,
  onCreate,
  onUpdate,
}: JournalFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    issn: '',
    e_issn: '',
    editor_id: '',
    is_active: true,
    tenant_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!journal

  useEffect(() => {
    if (journal) {
      setFormData({
        title: journal.title,
        description: journal.description || '',
        issn: journal.issn || '',
        e_issn: journal.e_issn || '',
        editor_id: journal.editor_id || '',
        is_active: journal.is_active,
        tenant_id: journal.tenant_id,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        issn: '',
        e_issn: '',
        editor_id: '',
        is_active: true,
        tenant_id: '',
      })
    }
    setError(null)
  }, [journal, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        issn: formData.issn || null,
        e_issn: formData.e_issn || null,
        journal_manager_id: formData.editor_id || null,
        is_active: formData.is_active,
        language: 'id', // Default language
      }

      // Use Server Actions (required)
      if (!isEdit && onCreate) {
        // Generate path from title if not provided
        if (!payload.path) {
          payload.path = formData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
        
        const result = await onCreate(payload)
        
        if (!result || (result && !result.success)) {
          throw new Error(result?.error || 'Failed to create journal')
        }
      } else if (isEdit && onUpdate) {
        payload.id = journal?.id
        
        const result = await onUpdate(payload)
        
        if (!result || (result && !result.success)) {
          throw new Error(result?.error || 'Failed to update journal')
        }
      } else {
        throw new Error('Server Actions (onCreate/onUpdate) are required')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEdit ? 'Edit Jurnal' : 'Tambah Jurnal Baru'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Jurnal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="issn" className="block text-sm font-medium text-gray-700 mb-1">
                    ISSN
                  </label>
                  <input
                    type="text"
                    id="issn"
                    value={formData.issn}
                    onChange={(e) => setFormData({ ...formData, issn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="e_issn" className="block text-sm font-medium text-gray-700 mb-1">
                    E-ISSN
                  </label>
                  <input
                    type="text"
                    id="e_issn"
                    value={formData.e_issn}
                    onChange={(e) => setFormData({ ...formData, e_issn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="editor_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Editor Utama
                </label>
                <select
                  id="editor_id"
                  value={formData.editor_id}
                  onChange={(e) => setFormData({ ...formData, editor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={loading}
                >
                  <option value="">Pilih Editor</option>
                  {editors.map((editor) => (
                    <option key={editor.id} value={editor.id}>
                      {editor.name} ({editor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-[#0056A1] focus:ring-[#0056A1] border-gray-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Aktif
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0056A1] rounded-md hover:bg-[#003d5c] transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

