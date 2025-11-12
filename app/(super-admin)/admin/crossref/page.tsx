/**
 * Crossref Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import ErrorAlert from '@/components/shared/ErrorAlert'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import PageHeader from '@/components/shared/PageHeader'
import { getDOIRegistrations, getDOIStatus, DOIRegistration } from '@/actions/crossref/get'

export default function CrossrefPage() {
  const [registrations, setRegistrations] = useState<DOIRegistration[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'registered' | 'pending' | 'failed'>('all')
  const [selectedRegistration, setSelectedRegistration] = useState<DOIRegistration | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetchRegistrations()
  }, [filterStatus])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      const result = await getDOIRegistrations({
        status: filterStatus,
        page: pagination.page,
        limit: pagination.limit,
      })

      if (!result.success) {
        setError(result.error || 'Failed to fetch DOI registrations')
        if (result.details) {
          console.error('Validation errors:', result.details)
        }
        return
      }

      if (result.data) {
        setRegistrations(result.data.registrations)
        setPagination(result.data.pagination)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch DOI registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckStatus = async (doi: string) => {
    startTransition(async () => {
      try {
        setError(null)
        setSuccess(null)
        const result = await getDOIStatus(doi)

        if (!result.success) {
          setError(result.error || 'Failed to check DOI status')
          return
        }

        if (result.data) {
          const statusMessage = `DOI Status: ${result.data.status}\nRegistered: ${result.data.registered ? 'Yes' : 'No'}`
          alert(statusMessage)
          fetchRegistrations()
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check DOI status')
      }
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Crossref DOI Management"
          description="Manage DOI registrations with Crossref"
        />
        <ContentCard>
          <LoadingSpinner message="Loading DOI registrations..." />
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crossref DOI Management"
        description="Manage DOI registrations with Crossref"
      />

      {error && <ErrorAlert message={error} />}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <ContentCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">DOI Registrations</h2>
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
            >
              <option value="all">All Status</option>
              <option value="registered">Registered</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={fetchRegistrations}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No DOI registrations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DOI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {registration.articles?.title || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.articles?.journals?.title || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`https://doi.org/${registration.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0056A1] hover:underline flex items-center"
                      >
                        {registration.doi}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(registration.status)}
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(registration.status)}`}>
                          {registration.status}
                        </span>
                      </div>
                      {registration.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {registration.error_message}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.crossref_deposit_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registration.registration_date
                        ? new Date(registration.registration_date).toLocaleString()
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleCheckStatus(registration.doi)}
                        disabled={isPending}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? 'Checking...' : 'Check Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {selectedRegistration && (
        <ContentCard>
          <h3 className="text-lg font-semibold mb-4">Registration Details</h3>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(selectedRegistration.crossref_response, null, 2)}
          </pre>
        </ContentCard>
      )}
    </div>
  )
}
