/**
 * Backup Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Download, Upload, RefreshCw, Database, Trash2 } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getBackups, BackupInfo, Backup } from '@/actions/backup/get'
import { createBackup } from '@/actions/backup/create'
import { deleteBackup } from '@/actions/backup/delete'

export default function BackupPage() {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchBackups()
  }, [])

  const fetchBackups = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const result = await getBackups()

      if (!result.success) {
        // If unauthorized, show more helpful message
        if (result.error === 'Unauthorized') {
          setError('You do not have permission to access this page. Please contact your administrator.')
        } else {
          setError(result.error || 'Failed to fetch backup information')
        }
        return
      }

      if (result.data) {
        setBackupInfo(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch backup information')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    if (!confirm('Are you sure you want to create a backup? This may take a few minutes.')) {
      return
    }

    startTransition(async () => {
      try {
        setError(null)
        setSuccess(null)
        const result = await createBackup({ backup_type: 'full' })

        if (!result.success) {
          setError(result.error || 'Failed to create backup')
          if (result.details) {
            console.error('Validation errors:', result.details)
          }
          return
        }

        setSuccess('Backup created successfully!')
        fetchBackups()
      } catch (err: any) {
        setError(err.message || 'Failed to create backup')
      }
    })
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      try {
        setError(null)
        setSuccess(null)
        const result = await deleteBackup(backupId)

        if (!result.success) {
          setError(result.error || 'Failed to delete backup')
          return
        }

        setSuccess('Backup deleted successfully!')
        fetchBackups()
      } catch (err: any) {
        setError(err.message || 'Failed to delete backup')
      }
    })
  }

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Backup & Restore"
          description="Manage system backups"
        />
        <ContentCard>
          <LoadingSpinner message="Loading backup information..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backup & Restore"
        description="Manage system backups and restore data"
      />

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Backup Statistics */}
      {backupInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ContentCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{backupInfo.total_backups}</div>
              <div className="text-sm text-gray-600">Total Backups</div>
            </div>
          </ContentCard>
          <ContentCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatFileSize(backupInfo.total_size)}</div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
          </ContentCard>
          <ContentCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {backupInfo.last_backup
                  ? new Date(backupInfo.last_backup.created_at).toLocaleDateString()
                  : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Backup</div>
            </div>
          </ContentCard>
          <ContentCard>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {backupInfo.backup_enabled ? 'Enabled' : 'Disabled'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </ContentCard>
        </div>
      )}

      <ContentCard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Backups</h2>
              <p className="text-sm text-gray-600">Create and manage system backups</p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={isPending}
              className="flex items-center px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Database className="w-4 h-4 mr-2" />
              {isPending ? 'Creating...' : 'Create Backup'}
            </button>
          </div>

          {!backupInfo || backupInfo.backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p>No backups found.</p>
              <p className="text-sm mt-2">Click "Create Backup" to create your first backup.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {backupInfo.backups.map((backup) => (
                <div
                  key={backup.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Database className="w-5 h-5 text-gray-400" />
                        <div className="font-medium text-gray-900">{backup.id}</div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(backup.status)}`}>
                          {backup.status}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {backup.backup_type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Created: {new Date(backup.created_at).toLocaleString()}</div>
                        {backup.file_size && (
                          <div>Size: {formatFileSize(backup.file_size)}</div>
                        )}
                        {backup.description && (
                          <div>Description: {backup.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {backup.file_url && (
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Download"
                          onClick={() => window.open(backup.file_url!, '_blank')}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentCard>

      <ContentCard>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Restore</h2>
          <p className="text-sm text-gray-600">Restore system from a backup</p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Upload backup file to restore</p>
            <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
              Choose File
            </button>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}


