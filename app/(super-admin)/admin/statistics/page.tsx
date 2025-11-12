/**
 * Statistics Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect } from 'react'
import ContentCard from '@/components/shared/ContentCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import ErrorAlert from '@/components/shared/ErrorAlert'
import { BarChart3, Users, BookOpen, FileText, Calendar, TrendingUp } from 'lucide-react'
import { getStatistics, StatisticsData } from '@/actions/statistics/get'
import PageHeader from '@/components/shared/PageHeader'

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'all' | 'day' | 'week' | 'month' | 'year'>('all')

  useEffect(() => {
    fetchStatistics()
  }, [period])

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getStatistics({ period })

      if (!result.success) {
        setError(result.error || 'Failed to fetch statistics')
        return
      }

      if (result.data) {
        setStats(result.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Statistics & Reports"
          description="View system statistics and reports"
        />
        <ContentCard>
          <LoadingSpinner message="Loading statistics..." />
        </ContentCard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Statistics & Reports"
          description="View system statistics and reports"
        />
        <ErrorAlert message={error} />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Statistics & Reports"
          description="View system statistics and reports"
        />
        <div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
          >
            <option value="all">All Time</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Users Statistics */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <Users className="w-6 h-6 text-[#0056A1]" />
          <h2 className="text-xl font-bold text-gray-900">Users</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">{stats.statistics.users.total}</div>
            <div className="text-sm text-blue-700">Total Users</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">{stats.statistics.users.editors}</div>
            <div className="text-sm text-green-700">Editors</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-900">{stats.statistics.users.reviewers}</div>
            <div className="text-sm text-orange-700">Reviewers</div>
          </div>
        </div>
      </ContentCard>

      {/* Journals Statistics */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <BookOpen className="w-6 h-6 text-[#0056A1]" />
          <h2 className="text-xl font-bold text-gray-900">Journals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">{stats.statistics.journals.total}</div>
            <div className="text-sm text-purple-700">Total Journals</div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-900">{stats.statistics.journals.tenants}</div>
            <div className="text-sm text-indigo-700">Active Tenants</div>
          </div>
        </div>
      </ContentCard>

      {/* Content Statistics */}
      <ContentCard>
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-6 h-6 text-[#0056A1]" />
          <h2 className="text-xl font-bold text-gray-900">Content</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg">
            <div className="text-2xl font-bold text-teal-900">{stats.statistics.content.articles.total}</div>
            <div className="text-sm text-teal-700">Total Articles</div>
            {period !== 'all' && (
              <div className="text-xs text-teal-600 mt-1">
                +{stats.statistics.content.articles.period} this period
              </div>
            )}
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-900">{stats.statistics.content.submissions.total}</div>
            <div className="text-sm text-pink-700">Total Submissions</div>
            {period !== 'all' && (
              <div className="text-xs text-pink-600 mt-1">
                +{stats.statistics.content.submissions.period} this period
              </div>
            )}
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-900">{stats.statistics.content.issues.total}</div>
            <div className="text-sm text-yellow-700">Total Issues</div>
          </div>
        </div>
      </ContentCard>

      {/* Submissions by Status */}
      {Object.keys(stats.statistics.content.submissions.byStatus).length > 0 && (
        <ContentCard>
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-[#0056A1]" />
            <h2 className="text-xl font-bold text-gray-900">Submissions by Status</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(stats.statistics.content.submissions.byStatus).map(
              ([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#0056A1] h-2 rounded-full"
                        style={{
                          width: `${(count / stats.statistics.content.submissions.total) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </ContentCard>
      )}
    </div>
  )
}


