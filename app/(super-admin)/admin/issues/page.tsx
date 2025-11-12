/**
 * Issues Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
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
import { getIssues, IssueWithRelations } from '@/actions/issues/get'
import { createIssue } from '@/actions/issues/create'
import { updateIssue } from '@/actions/issues/update'
import { deleteIssue } from '@/actions/issues/delete'
import { publishIssue } from '@/actions/issues/publish'
import { getJournals } from '@/actions/journals/get'

interface Journal {
  id: string
  title: string
}

export default function IssuesPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'future' | 'back'>('future')
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [isPending, startTransition] = useTransition()

  // Fetch journals for dropdown
  useEffect(() => {
    const fetchJournals = async () => {
      try {
        const result = await getJournals({ page: 1, limit: 1000 })
        if (result.success && result.data) {
          setJournals(result.data.journals.map(j => ({ id: j.id, title: j.title })))
        }
      } catch (error) {
        console.error('Error fetching journals:', error)
        setJournals([])
      }
    }
    fetchJournals()
  }, [])

  // Fetch issues
  const fetchIssues = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getIssues({
        page,
        limit,
        status: activeTab,
        search: search || null,
      })
      
      if (!result.success) {
        setError(result.error || 'Gagal memuat data isu')
        setIssues([])
        return
      }

      if (result.data) {
        // Transform IssueWithRelations to Issue format
        const transformedIssues: Issue[] = result.data.issues.map((issue: IssueWithRelations) => ({
          id: issue.id,
          journal_id: issue.journal_id,
          volume: issue.volume,
          number: issue.number,
          year: issue.year,
          title: issue.title,
          description: issue.description,
          published_date: issue.published_date,
          is_published: issue.is_published,
          itemCount: issue.itemCount,
          status: issue.status,
          journal_title: issue.journal_title,
        }))
        
        setIssues(transformedIssues)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      }
    } catch (error: any) {
      setError(error.message || 'Gagal memuat data isu')
      setIssues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssues()
  }, [page, limit, activeTab, search])

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus isu ini?')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteIssue(id)
        
        if (!result.success) {
          alert(result.error || 'Gagal menghapus isu')
          return
        }

        await fetchIssues()
      } catch (error: any) {
        alert(error.message || 'Gagal menghapus isu')
      }
    })
  }

  const handlePublish = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin mempublikasikan isu ini?')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await publishIssue(id)
        
        if (!result.success) {
          alert(result.error || 'Gagal mempublikasikan isu')
          return
        }

        await fetchIssues()
        // If on future tab, switch to back tab after publish
        if (activeTab === 'future') {
          setActiveTab('back')
        }
      } catch (error: any) {
        alert(error.message || 'Gagal mempublikasikan isu')
      }
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingIssue(null)
  }

  const handleModalSuccess = async () => {
    fetchIssues()
    handleModalClose()
    // If status changed to published, switch to back tab
    if (editingIssue && activeTab === 'future') {
      // Check if the edited issue is now published
      // This will be handled by the refetch
    }
  }

  const tabs = [
    { id: 'future', label: 'Future Issues' },
    { id: 'back', label: 'Back Issues' },
  ]

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

        {loading || isPending ? (
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
      />
    </div>
  )
}

