/**
 * Health Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect } from 'react'
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getHealthStatus, HealthData } from '@/actions/health/get'

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getHealthStatus()

      if (!result.success) {
        setError(result.error || 'Failed to fetch health status')
        return
      }

      if (result.data) {
        setHealth(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Health"
          description="Monitor system health and status"
        />
        <ContentCard>
          <LoadingSpinner message="Loading health status..." />
        </ContentCard>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Health"
          description="Monitor system health and status"
        />
        <ErrorAlert message="Failed to load health status" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Monitor system health and status"
      />

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {getStatusIcon(health.status)}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <p className="text-sm text-gray-600">
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
            {health.status.toUpperCase()}
          </span>
        </div>
      </ContentCard>

      <ContentCard>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Checks</h2>
        <div className="space-y-4">
          {Object.entries(health.checks).map(([key, check]) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(check.status)}
                <div>
                  <div className="font-medium text-gray-900 capitalize">{key}</div>
                  {check.error && (
                    <div className="text-sm text-red-600 mt-1">{check.error}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Response Time</div>
                <div className="font-medium text-gray-900">{check.response_time}ms</div>
              </div>
            </div>
          ))}
        </div>
      </ContentCard>

      <ContentCard>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Cache Entries</div>
            <div className="text-2xl font-bold text-gray-900">{health.statistics.cache_entries}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Recent Logs (24h)</div>
            <div className="text-2xl font-bold text-gray-900">{health.statistics.recent_logs}</div>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}


