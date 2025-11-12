'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { usePagination } from '@/hooks/usePagination'
import IssueTable, { Issue } from '@/components/admin/IssueTable'
import IssueFormModal from '@/components/admin/IssueFormModal'
import PageHeader from '@/components/shared/PageHeader'
import SearchBar from '@/components/shared/SearchBar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Pagination from '@/components/shared/Pagination'
import ErrorAlert from '@/components/shared/ErrorAlert'
import ContentCard from '@/components/shared/ContentCard'
import Tabs from '@/components/shared/Tabs'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api/client'

interface Journal {
  id: string
  title: string
}

interface User {
  id: string
  email?: string
}

interface IssuesClientPageProps {
  user: User
  journal: Journal
}

export default function IssuesClientPage({ user, journal }: IssuesClientPageProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'future' | 'back'>('future')
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [journals, setJournals] = useState<Journal[]>([journal])
  const [currentJournalId, setCurrentJournalId] = useState<string>(journal.id)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch issues
  const fetchIssues = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: activeTab,
        ...(search && { search }),
      })
      
      console.log('[ISSUES PAGE] Fetching issues with params:', params.toString())
      const result = await apiGet<{
        issues: Issue[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/issues?${params}`)
      
      console.log('[ISSUES PAGE] Issues fetched:', result.issues?.length || 0)
      setIssues(result.issues || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 0)
    } catch (error: any) {
      console.error('[ISSUES PAGE] Error fetching issues:', error)
      if (error.response?.status === 403) {
        setError('Anda tidak memiliki izin untuk mengakses halaman ini.')
      } else if (error.response?.status === 404) {
        setError('Jurnal tidak ditemukan.')
      } else {
        setError(error.message || 'Gagal memuat data isu')
      }
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentJournalId) {
      fetchIssues()
    }
  }, [page, limit, activeTab, search, currentJournalId])

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus isu ini?')) {
      return
    }

    try {
      await apiDelete(`/api/issues/${id}`)
      fetchIssues()
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus isu')
    }
  }

  const handlePublish = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mempublikasikan isu ini?')) {
      return
    }

    try {
      await apiPost(`/api/issues/${id}/publish`, {})
      fetchIssues()
      // If on future tab, switch to back tab after publish
      if (activeTab === 'future') {
        setActiveTab('back')
      }
    } catch (error: any) {
      alert(error.message || 'Gagal mempublikasikan isu')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingIssue(null)
  }

  const handleModalSuccess = async () => {
    fetchIssues()
    handleModalClose()
  }

  const tabs = [
    { id: 'future', label: 'Future Issues' },
    { id: 'back', label: 'Back Issues' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner message="Memuat data isu..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Manajemen Isu"
          description="Kelola isu jurnal"
        />
        <ErrorAlert 
          message={error} 
          action={
            <button
              onClick={() => router.push('/dashboard')}
              className="ml-4 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Isu"
        description={`Kelola isu jurnal (Total: ${total} isu)`}
        action={
          activeTab === 'future' ? (
            <button
              onClick={() => {
                setEditingIssue(null)
                setIsModalOpen(true)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Isu Baru</span>
            </button>
          ) : null
        }
      />

      {error && <ErrorAlert message={error} />}

      <ContentCard>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => {
            setActiveTab(tabId as 'future' | 'back')
            goToPage(1) // Reset to first page when switching tabs
          }}
        />

        <div className="mt-4">
          <SearchBar
            placeholder="Cari berdasarkan nama isu, volume/nomor, atau tahun..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {loading ? (
          <LoadingSpinner message="Memuat data isu..." />
        ) : (
          <>
            <div className="mt-4">
              <IssueTable
                issues={issues}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={activeTab === 'future' ? handlePublish : undefined}
                onRefresh={fetchIssues}
              />
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={goToPage}
              itemName="isu"
            />
          </>
        )}
      </ContentCard>

      <IssueFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        issue={editingIssue}
        journals={journals}
        apiPrefix="/api/issues"
      />
    </div>
  )
}