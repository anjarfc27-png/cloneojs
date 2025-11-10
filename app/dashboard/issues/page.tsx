'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

export default function DashboardIssuesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'future' | 'back'>('future')
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Check if user is super admin and redirect to admin issues if so
  useEffect(() => {
    async function checkRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is super admin
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .single()

      if (tenantUser) {
        // Redirect super admin to admin issues page
        router.push('/admin/issues')
        return
      }

      // Get user's journal
      const { data: userJournal } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (userJournal) {
        // Get journal for this tenant
        const { data: journal } = await supabase
          .from('journals')
          .select('id, title')
          .eq('tenant_id', userJournal.tenant_id)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (journal) {
          setCurrentJournalId(journal.id)
          setJournals([journal])
        }
      }
    }

    checkRole()
  }, [router])

  // Fetch issues
  const fetchIssues = async () => {
    if (!currentJournalId) return

    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: activeTab,
        journalId: currentJournalId,
        ...(search && { search }),
      })
      
      const result = await apiGet<{
        issues: Issue[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(`/api/admin/issues?${params}`)
      
      setIssues(result.issues || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 0)
    } catch (error: any) {
      setError(error.message || 'Gagal memuat data isu')
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
      await apiDelete(`/api/admin/issues/${id}`)
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
      await apiPost(`/api/admin/issues/${id}/publish`, {})
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

  if (!currentJournalId) {
    return (
      <div className="space-y-6">
        <LoadingSpinner message="Memuat data jurnal..." />
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
      />
    </div>
  )
}

