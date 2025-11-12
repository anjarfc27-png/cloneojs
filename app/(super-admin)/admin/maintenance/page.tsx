/**
 * Maintenance Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Wrench, RefreshCw, Database, Trash2, FolderOpen } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getMaintenanceTasks, MaintenanceTask, MaintenanceInfo } from '@/actions/maintenance/get'
import { runMaintenanceTask } from '@/actions/maintenance/run'

export default function MaintenancePage() {
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [runningTask, setRunningTask] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const result = await getMaintenanceTasks()

      if (!result.success) {
        setError(result.error || 'Failed to fetch maintenance tasks')
        return
      }

      if (result.data) {
        setMaintenanceInfo(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleRunTask = async (taskId: string) => {
    const task = maintenanceInfo?.maintenance_tasks.find((t) => t.id === taskId)
    if (!confirm(`Are you sure you want to run "${task?.name || taskId}"? This may take a few minutes.`)) {
      return
    }

    startTransition(async () => {
      try {
        setRunningTask(taskId)
        setError(null)
        setSuccess(null)
        const result = await runMaintenanceTask(taskId)

        if (!result.success) {
          setError(result.error || 'Failed to run maintenance task')
          if (result.details) {
            console.error('Validation errors:', result.details)
          }
          return
        }

        if (result.data) {
          setSuccess(result.data.message || 'Task completed successfully!')
          // Refresh tasks to get updated status
          fetchTasks()
        }
      } catch (err: any) {
        setError(err.message || 'Failed to run maintenance task')
      } finally {
        setRunningTask(null)
      }
    })
  }

  const getTaskIcon = (taskId: string) => {
    switch (taskId) {
      case 'clear_cache':
        return RefreshCw
      case 'optimize_database':
        return Database
      case 'cleanup_old_data':
        return Trash2
      case 'rebuild_indexes':
        return FolderOpen
      default:
        return Wrench
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Data Maintenance"
          description="Maintain and optimize system data"
        />
        <ContentCard>
          <LoadingSpinner message="Loading maintenance tasks..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Maintenance"
        description="Maintain and optimize system data"
      />

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Cache Status */}
      {maintenanceInfo && maintenanceInfo.cache_status.entries > 0 && (
        <ContentCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cache Status</h2>
              <p className="text-sm text-gray-600">
                {maintenanceInfo.cache_status.entries} cache entries
                {maintenanceInfo.cache_status.last_updated && (
                  <span className="ml-2">
                    • Last updated: {new Date(maintenanceInfo.cache_status.last_updated).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </ContentCard>
      )}

      <ContentCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h2>
          <p className="text-sm text-gray-600">Run maintenance tasks to optimize system performance</p>
        </div>

        {!maintenanceInfo || maintenanceInfo.maintenance_tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wrench className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p>No maintenance tasks available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceInfo.maintenance_tasks.map((task) => {
              const Icon = getTaskIcon(task.id)
              const isRunning = runningTask === task.id || (isPending && runningTask === task.id)

              return (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                          task.status === 'ready' ? 'bg-green-100 text-green-800' : 
                          task.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunTask(task.id)}
                      disabled={isRunning || isPending}
                      className="px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#004494] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRunning ? 'Running...' : 'Run'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ContentCard>
    </div>
  )
}


