/**
 * Activity Log Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import ContentCard from '@/components/shared/ContentCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorAlert from '@/components/shared/ErrorAlert'
import Pagination from '@/components/shared/Pagination'
import SearchBar from '@/components/shared/SearchBar'
import { usePagination } from '@/hooks/usePagination'
import { FileText, Trash2, Filter } from 'lucide-react'
import { getActivityLogs, ActivityLogWithUser } from '@/actions/activity-logs/get'
import { cleanupActivityLogs } from '@/actions/activity-logs/cleanup'
import { useAdminAuth } from '@/components/admin/AdminAuthProvider'

interface ActivityLog {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntityType, setFilterEntityType] = useState('')
  const [availableActions, setAvailableActions] = useState<string[]>([])
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 50 })
  const [isPending, startTransition] = useTransition()
  const { isReady, getAccessToken } = useAdminAuth()

  useEffect(() => {
    if (!isReady) return
    fetchLogs()
  }, [isReady, page, limit, filterAction, filterEntityType])

  const fetchLogs = async () => {
    if (!isReady) return
    try {
      setLoading(true)
      setError(null)

      const accessToken = await getAccessToken()
      const result = await getActivityLogs({
        page,
        limit,
        action: filterAction || null,
        entity_type: filterEntityType || null,
        accessToken,
      })

      if (!result.success) {
        setError(result.error || 'Failed to fetch activity logs')
        return
      }

      if (result.data) {
        // Transform ActivityLogWithUser to ActivityLog format
        const transformedLogs: ActivityLog[] = result.data.logs.map((log: ActivityLogWithUser) => ({
          id: log.id,
          user_id: log.user_id,
          user_email: log.user_email,
          user_name: log.user_name,
          action: log.action,
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          details: log.details,
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at,
        }))

        setLogs(transformedLogs)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)

        // Update available filters
        if (result.data.filters) {
          setAvailableActions(result.data.filters.actions || [])
          setAvailableEntityTypes(result.data.filters.entity_types || [])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity logs')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOldLogs = async () => {
    if (!confirm('Are you sure you want to delete logs older than 90 days? This action cannot be undone.')) {
      return
    }

    startTransition(async () => {
      try {
        const accessToken = await getAccessToken()
        const result = await cleanupActivityLogs({ days: 90 }, { accessToken })

        if (!result.success) {
          setError(result.error || 'Failed to delete old logs')
          return
        }

        alert(`Successfully deleted ${result.data?.deleted || 0} old logs`)
        await fetchLogs()
      } catch (err: any) {
        setError(err.message || 'Failed to delete old logs')
      }
    })
  }

  const formatDetails = (details: any) => {
    if (!details) return '-'
    if (typeof details === 'string') {
      try {
        return JSON.stringify(JSON.parse(details), null, 2)
      } catch {
        return details
      }
    }
    return JSON.stringify(details, null, 2)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-600">View system activity logs and audit trail</p>
        </div>
        <button
          onClick={handleDeleteOldLogs}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Old Logs</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value)
                  goToPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              >
                <option value="">All Actions</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={filterEntityType}
                onChange={(e) => {
                  setFilterEntityType(e.target.value)
                  goToPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              >
                <option value="">All Entity Types</option>
                {availableEntityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading || isPending ? (
          <LoadingSpinner message="Loading activity logs..." />
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.entity_type ? (
                          <>
                            <div>{log.entity_type}</div>
                            {log.entity_id && (
                              <div className="text-xs text-gray-400">
                                {log.entity_id.substring(0, 8)}...
                              </div>
                            )}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.user_id ? (
                          <div>
                            {log.user_name && (
                              <div className="font-medium text-gray-900">{log.user_name}</div>
                            )}
                            {log.user_email && (
                              <div className="text-xs text-gray-500">{log.user_email}</div>
                            )}
                            {!log.user_name && !log.user_email && (
                              <span className="text-xs text-gray-400">
                                {log.user_id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-md">
                              {formatDetails(log.details)}
                            </pre>
                          </details>
                        ) : (
                          '-'
                        )}
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
              itemName="log entries"
            />
          </>
        )}
      </ContentCard>
    </div>
  )
}


