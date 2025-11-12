/**
 * Tasks Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Play, Pause, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getTasks, SystemTask } from '@/actions/tasks/get'
import { updateTask } from '@/actions/tasks/update'
import { runTask } from '@/actions/tasks/run'

export default function TasksPage() {
  const [tasks, setTasks] = useState<SystemTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<SystemTask | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getTasks({ include_logs: true })

      if (!result.success) {
        setError(result.error || 'Failed to fetch system tasks')
        return
      }

      if (result.data) {
        setTasks(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (task: SystemTask) => {
    startTransition(async () => {
      try {
        const result = await updateTask(task.id, {
          enabled: !task.enabled,
        })

        if (!result.success) {
          setError(result.error || 'Failed to update task')
          return
        }

        fetchTasks()
      } catch (err: any) {
        setError(err.message || 'Failed to update task')
      }
    })
  }

  const handleRunTask = async (task: SystemTask) => {
    if (!confirm(`Are you sure you want to run "${task.task_name}" now?`)) {
      return
    }

    startTransition(async () => {
      try {
        const result = await runTask(task.id)

        if (!result.success) {
          setError(result.error || 'Failed to run task')
          return
        }

        fetchTasks()
      } catch (err: any) {
        setError(err.message || 'Failed to run task')
      }
    })
  }

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Scheduled Tasks"
          description="Manage system scheduled tasks"
        />
        <ContentCard>
          <LoadingSpinner message="Loading system tasks..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Tasks"
        description="Manage system scheduled tasks"
      />

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">System Tasks</h2>
          <p className="text-sm text-gray-600">Manage automated system tasks</p>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No system tasks found.
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(task.last_status)}
                      <h3 className="text-lg font-medium text-gray-900">{task.task_name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.last_status)}`}>
                        {task.last_status || 'pending'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${task.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {task.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Class: <code className="bg-gray-100 px-2 py-1 rounded">{task.task_class}</code></div>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Interval: {formatInterval(task.run_interval)}
                        </span>
                        {task.last_run && (
                          <span>Last run: {new Date(task.last_run).toLocaleString()}</span>
                        )}
                        {task.next_run && (
                          <span>Next run: {new Date(task.next_run).toLocaleString()}</span>
                        )}
                      </div>
                      {task.last_message && (
                        <div className="text-xs text-gray-500">{task.last_message}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleEnabled(task)}
                      disabled={isPending}
                      className={`p-2 rounded-md ${
                        task.enabled
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={task.enabled ? 'Disable' : 'Enable'}
                    >
                      {task.enabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleRunTask(task)}
                      disabled={isPending}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Run now"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                      title="View logs"
                    >
                      <Clock className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {selectedTask?.id === task.id && task.logs && task.logs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Logs</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {task.logs.map((log) => (
                        <div
                          key={log.id}
                          className="text-xs p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                            <span className="text-gray-500">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          {log.message && (
                            <div className="mt-1 text-gray-700">{log.message}</div>
                          )}
                          {log.execution_time && (
                            <div className="mt-1 text-gray-500">
                              Execution time: {log.execution_time}ms
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  )
}


