/**
 * Issue Form Modal (Using Server Actions)
 * 
 * This component uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { X } from 'lucide-react'
import { Issue } from './IssueTable'
import { createIssue } from '@/actions/issues/create'
import { updateIssue } from '@/actions/issues/update'
import { useAdminAuth } from '@/components/admin/AdminAuthProvider'

interface Journal {
  id: string
  title: string
}

interface IssueFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  issue?: Issue | null
  journals: Journal[]
  useServerActions?: boolean // Use Server Actions instead of API routes
  apiPrefix?: string // Legacy prop (ignored when using Server Actions)
}

export default function IssueFormModal({
  isOpen,
  onClose,
  onSuccess,
  issue,
  journals,
  useServerActions = true, // Default to Server Actions
}: IssueFormModalProps) {
  const [formData, setFormData] = useState({
    journal_id: '',
    volume: '',
    number: '',
    year: '',
    title: '',
    description: '',
    published_date: '',
    status: 'draft' as 'draft' | 'scheduled' | 'published',
    access_status: 'open',
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { getAccessToken } = useAdminAuth()

  const isEdit = !!issue

  // Auto-set journal_id if only one journal
  useEffect(() => {
    if (journals.length > 0 && !formData.journal_id) {
      setFormData(prev => ({ ...prev, journal_id: journals[0].id }))
    }
  }, [journals])

  useEffect(() => {
    if (issue) {
      // Determine status from issue data
      let status: 'draft' | 'scheduled' | 'published' = 'draft'
      if (issue.is_published) {
        status = 'published'
      } else if (issue.published_date) {
        status = 'scheduled'
      }

      setFormData({
        journal_id: issue.journal_id,
        volume: issue.volume?.toString() || '',
        number: issue.number || '',
        year: issue.year.toString(),
        title: issue.title || '',
        description: issue.description || '',
        published_date: issue.published_date ? issue.published_date.split('T')[0] : '',
        status,
        access_status: 'open',
      })
    } else {
      setFormData({
        journal_id: journals.length > 0 ? journals[0].id : '',
        volume: '',
        number: '',
        year: new Date().getFullYear().toString(),
        title: '',
        description: '',
        published_date: '',
        status: 'draft',
        access_status: 'open',
      })
    }
    setError(null)
  }, [issue, isOpen, journals])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.journal_id || !formData.year) {
      setError('Jurnal dan Tahun harus diisi')
      return
    }

    if (formData.status === 'published' && !formData.published_date) {
      setError('Tanggal publikasi harus diisi untuk status Terbit')
      return
    }

    if (formData.status === 'scheduled' && !formData.published_date) {
      setError('Tanggal publikasi harus diisi untuk status Dijadwalkan')
      return
    }

    if (!useServerActions) {
      // Fallback to API routes if needed
      setError('Server Actions mode is required')
      return
    }

    startTransition(async () => {
      try {
        const payload: any = {
          journal_id: formData.journal_id,
          volume: formData.volume ? parseInt(formData.volume) : null,
          number: formData.number || null,
          year: parseInt(formData.year),
          title: formData.title || null,
          description: formData.description || null,
          published_date: formData.published_date ? new Date(formData.published_date).toISOString() : null,
          status: formData.status,
          access_status: formData.access_status,
        }

        let result

        const accessToken = await getAccessToken()

        if (isEdit && issue) {
          result = await updateIssue(
            {
              id: issue.id,
              ...payload,
            },
            { accessToken }
          )
        } else {
          result = await createIssue(payload, { accessToken })
        }

        if (!result.success) {
          setError(result.error || 'Terjadi kesalahan saat menyimpan data')
          if (result.details) {
            console.error('Validation errors:', result.details)
          }
          return
        }

        onSuccess()
        onClose()
      } catch (error: any) {
        setError(error.message || 'Terjadi kesalahan saat menyimpan data')
      }
    })
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
                {isEdit ? 'Edit Isu' : 'Buat Isu Baru'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                aria-label="Close"
                title="Close"
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
                <label htmlFor="journal_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Jurnal <span className="text-red-500">*</span>
                </label>
                <select
                  id="journal_id"
                  required
                  value={formData.journal_id}
                  onChange={(e) => setFormData({ ...formData, journal_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={isPending || isEdit}
                >
                  <option value="">Pilih Jurnal</option>
                  {journals.map((journal) => (
                    <option key={journal.id} value={journal.id}>
                      {journal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-1">
                    Volume
                  </label>
                  <input
                    type="number"
                    id="volume"
                    min="1"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor
                  </label>
                  <input
                    type="text"
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                    disabled={isPending}
                  />
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="year"
                    required
                    min="1900"
                    max="2100"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Isu
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={isPending}
                  placeholder="Contoh: Vol. 1 No. 1 (2025): Judul"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={isPending}
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'scheduled' | 'published' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                  disabled={isPending}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Dijadwalkan</option>
                  <option value="published">Terbit</option>
                </select>
              </div>

              {(formData.status === 'scheduled' || formData.status === 'published') && (
                <div>
                  <label htmlFor="published_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Publikasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="published_date"
                    required={formData.status === 'scheduled' || formData.status === 'published'}
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
                    disabled={isPending}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0056A1] rounded-md hover:bg-[#003d5c] transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

