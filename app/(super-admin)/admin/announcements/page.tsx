/**
 * Announcements Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import ContentCard from '@/components/shared/ContentCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorAlert from '@/components/shared/ErrorAlert'
import Pagination from '@/components/shared/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { getAnnouncements, AnnouncementWithRelations } from '@/actions/announcements/get'
import { createAnnouncement } from '@/actions/announcements/create'
import { updateAnnouncement, updateAnnouncementStatus } from '@/actions/announcements/update'
import { deleteAnnouncement } from '@/actions/announcements/delete'
import { useAdminAuth } from '@/components/admin/AdminAuthProvider'

interface Announcement {
  id: string
  title: string
  description: string | null
  short_description: string | null
  type: string
  enabled: boolean
  date_posted: string
  date_expire: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    enabled: true,
    date_expire: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { isReady } = useAdminAuth()

  useEffect(() => {
    if (!isReady) return
    fetchAnnouncements()
  }, [isReady, page, limit])

  const fetchAnnouncements = async () => {
    if (!isReady) return
    try {
      setLoading(true)
      setError(null)
      const result = await getAnnouncements({
        page,
        limit,
      })

      if (!result.success) {
        setError(result.error || 'Failed to fetch announcements')
        return
      }

      if (result.data) {
        // Transform AnnouncementWithRelations to Announcement format
        const transformedAnnouncements: Announcement[] = result.data.announcements.map((a: AnnouncementWithRelations) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          short_description: a.short_description,
          type: a.type,
          enabled: a.enabled,
          date_posted: a.date_posted,
          date_expire: a.date_expire,
          created_by: a.created_by,
          created_at: a.created_at,
          updated_at: a.updated_at,
        }))

        setAnnouncements(transformedAnnouncements)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      description: '',
      short_description: '',
      type: 'info',
      enabled: true,
      date_expire: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      description: announcement.description || '',
      short_description: announcement.short_description || '',
      type: announcement.type,
      enabled: announcement.enabled,
      date_expire: announcement.date_expire
        ? new Date(announcement.date_expire).toISOString().split('T')[0]
        : '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteAnnouncement({ id })

        if (!result.success) {
          setError(result.error || 'Failed to delete announcement')
          return
        }

        await fetchAnnouncements()
      } catch (err: any) {
        setError(err.message || 'Failed to delete announcement')
      }
    })
  }

  const handleToggleEnabled = async (announcement: Announcement) => {
    startTransition(async () => {
      try {
        const result = await updateAnnouncementStatus({
          id: announcement.id,
          enabled: !announcement.enabled,
        })

        if (!result.success) {
          setError(result.error || 'Failed to update announcement')
          return
        }

        await fetchAnnouncements()
      } catch (err: any) {
        setError(err.message || 'Failed to update announcement')
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    startTransition(async () => {
      try {
        const payload: any = {
          title: formData.title,
          description: formData.description || null,
          short_description: formData.short_description || null,
          type: formData.type,
          enabled: formData.enabled,
        }

        if (formData.date_expire) {
          payload.date_expire = new Date(formData.date_expire).toISOString()
        }

        if (editingAnnouncement) {
          payload.id = editingAnnouncement.id
          const result = await updateAnnouncement(payload)

          if (!result.success) {
            setFormError(result.error || 'Failed to update announcement')
            if (result.details) {
              console.error('Validation errors:', result.details)
            }
            return
          }
        } else {
          const result = await createAnnouncement(payload)

          if (!result.success) {
            setFormError(result.error || 'Failed to create announcement')
            if (result.details) {
              console.error('Validation errors:', result.details)
            }
            return
          }
        }

        setIsModalOpen(false)
        setFormError(null)
        await fetchAnnouncements()
      } catch (err: any) {
        setFormError(err.message || 'Failed to save announcement')
      }
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
          <p className="text-gray-600">Manage site-wide announcements</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        {loading || isPending ? (
          <LoadingSpinner message="Loading announcements..." />
        ) : announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No announcements found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Posted
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
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {announcement.title}
                        </div>
                        {announcement.short_description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {announcement.short_description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(
                            announcement.type
                          )}`}
                        >
                          {announcement.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            announcement.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {announcement.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(announcement.date_posted).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {announcement.date_expire
                          ? new Date(announcement.date_expire).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleEnabled(announcement)}
                          className="text-[#0056A1] hover:text-[#003d5c]"
                          title={announcement.enabled ? 'Disable' : 'Enable'}
                        >
                          {announcement.enabled ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="text-[#0056A1] hover:text-[#003d5c]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={goToPage}
              itemName="announcements"
            />
          </>
        )}
      </ContentCard>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) =>
                    setFormData({ ...formData, short_description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expire Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.date_expire}
                    onChange={(e) =>
                      setFormData({ ...formData, date_expire: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-[#0056A1] border-gray-300 rounded focus:ring-[#0056A1]"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
                >
                  {editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


