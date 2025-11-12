/**
 * System Information Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect } from 'react'
import ContentCard from '@/components/shared/ContentCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorAlert from '@/components/shared/ErrorAlert'
import { Server, Database, Cpu, HardDrive, Globe, Shield } from 'lucide-react'
import { getSystemInfo, SystemInfoData } from '@/actions/system-info/get'
import PageHeader from '@/components/shared/PageHeader'

export default function SystemInformationPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSystemInfo()
  }, [])

  const fetchSystemInfo = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getSystemInfo()

      if (!result.success) {
        setError(result.error || 'Failed to fetch system information')
        return
      }

      if (result.data) {
        setSystemInfo(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system information')
    } finally {
      setLoading(false)
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Information"
          description="View system information and server status"
        />
        <ContentCard>
          <LoadingSpinner message="Loading system information..." />
        </ContentCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Information"
          description="View system information and server status"
        />
        <ErrorAlert message={error} />
      </div>
    )
  }

  if (!systemInfo) {
    return null
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Information"
        description="View system information and server status"
      />

      {error && <ErrorAlert message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Information */}
        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-6 h-6 text-[#0056A1]" />
            <h2 className="text-xl font-bold text-gray-900">System</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Node.js Version</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.system.nodeVersion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Platform</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.system.platform}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Architecture</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.system.architecture}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Next.js Version</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.system.nextVersion}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  systemInfo.system.environment === 'production'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemInfo.system.environment}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Uptime</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatUptime(systemInfo.system.uptime)}
              </dd>
            </div>
          </dl>
        </ContentCard>

        {/* Memory Information */}
        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="w-6 h-6 text-[#0056A1]" />
            <h2 className="text-xl font-bold text-gray-900">Memory</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Heap Used</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {systemInfo.system.memory.used} MB
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Heap Total</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {systemInfo.system.memory.total} MB
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">External</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {systemInfo.system.memory.external} MB
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Usage</dt>
              <dd className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0056A1] h-2 rounded-full"
                    style={{
                      width: `${(systemInfo.system.memory.used / systemInfo.system.memory.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {Math.round((systemInfo.system.memory.used / systemInfo.system.memory.total) * 100)}%
                </p>
              </dd>
            </div>
          </dl>
        </ContentCard>

        {/* Server Information */}
        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-6 h-6 text-[#0056A1]" />
            <h2 className="text-xl font-bold text-gray-900">Server</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Hostname</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.server.hostname}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Port</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.server.port}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(systemInfo.system.timestamp).toLocaleString()}
              </dd>
            </div>
          </dl>
        </ContentCard>

        {/* Database Information */}
        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-[#0056A1]" />
            <h2 className="text-xl font-bold text-gray-900">Database</h2>
          </div>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.database.type}</dd>
            </div>
            {systemInfo.database.version && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{systemInfo.database.version}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  systemInfo.database.status === 'connected'
                    ? 'bg-green-100 text-green-800'
                    : systemInfo.database.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemInfo.database.status === 'connected' ? 'Connected' : 
                   systemInfo.database.status === 'error' ? 'Error' : 
                   'Unknown'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Supabase URL</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">{systemInfo.system.supabaseUrl}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Supabase Key</dt>
              <dd className="mt-1 text-sm text-gray-900">{systemInfo.system.supabaseKey}</dd>
            </div>
          </dl>
        </ContentCard>

        {/* Database Statistics */}
        {systemInfo.databaseStats && (
          <ContentCard>
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-[#0056A1]" />
              <h2 className="text-xl font-bold text-gray-900">Database Statistics</h2>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Tables</dt>
                <dd className="mt-1 text-sm text-gray-900">{systemInfo.databaseStats.totalTables}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                <dd className="mt-1 text-sm text-gray-900">{systemInfo.databaseStats.totalUsers}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Journals</dt>
                <dd className="mt-1 text-sm text-gray-900">{systemInfo.databaseStats.totalJournals}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Articles</dt>
                <dd className="mt-1 text-sm text-gray-900">{systemInfo.databaseStats.totalArticles}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Issues</dt>
                <dd className="mt-1 text-sm text-gray-900">{systemInfo.databaseStats.totalIssues}</dd>
              </div>
            </dl>
          </ContentCard>
        )}
      </div>

      {/* Security Information */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-[#0056A1]" />
          <h2 className="text-xl font-bold text-gray-900">Security</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Environment</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {systemInfo.system.environment === 'production' ? (
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  Production
                </span>
              ) : (
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Development
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">SSL/TLS</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Enabled (via Supabase)
              </span>
            </dd>
          </div>
        </div>
      </ContentCard>
    </div>
  )
}


