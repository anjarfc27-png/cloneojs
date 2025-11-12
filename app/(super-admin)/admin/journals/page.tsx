/**
 * Journals Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { usePagination } from '@/hooks/usePagination'
import JournalTable, { Journal } from '@/components/admin/JournalTable'
import JournalFormModal from '@/components/admin/JournalFormModal'
import PageHeader from '@/components/shared/PageHeader'
import SearchBar from '@/components/shared/SearchBar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Pagination from '@/components/shared/Pagination'
import ErrorAlert from '@/components/shared/ErrorAlert'
import ContentCard from '@/components/shared/ContentCard'
import { getJournals, JournalWithRelations } from '@/actions/journals/get'
import { createJournal } from '@/actions/journals/create'
import { updateJournal } from '@/actions/journals/update'
import { deleteJournal } from '@/actions/journals/delete'
import { useAdminAuth } from '@/components/admin/AdminAuthProvider'

interface Editor {
  id: string
  name: string
  email: string
}

export default function JournalsPage() {
  const [search, setSearch] = useState('')
  const [editors, setEditors] = useState<Editor[]>([])
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null)
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { getAccessToken } = useAdminAuth()

  // Fetch journals
  const fetchJournals = async () => {
    try {
      setLoading(true)
      setError(null)
      const accessToken = await getAccessToken()
      const result = await getJournals({
        page,
        limit,
        search,
        accessToken,
      })

      if (!result.success) {
        setError(result.error || 'Failed to fetch journals')
        return
      }

      if (result.data) {
        // Transform JournalWithRelations to Journal format
        const transformedJournals: Journal[] = result.data.journals.map((j: JournalWithRelations) => ({
          id: j.id,
          title: j.title,
          issn: j.issn || null,
          e_issn: j.e_issn || null,
          description: j.description || null,
          editor_name: j.editor_name || null,
          editor_id: j.editor_id || null,
          is_active: j.is_active,
          created_at: j.created_at,
          tenant_id: j.tenant_id,
          tenant_name: j.tenant_name || undefined,
        }))

        setJournals(transformedJournals)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch journals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJournals()
  }, [page, limit, search])

  // Fetch editors (still using API for now, can be migrated later)
  useEffect(() => {
    // This can be migrated to Server Action later
    // For now, we'll leave it as is or make it optional
    setEditors([])
  }, [])

  const handleEdit = (journal: Journal) => {
    setEditingJournal(journal)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
      return
    }

    startTransition(async () => {
      try {
        const accessToken = await getAccessToken()
        const result = await deleteJournal({ id }, { accessToken })

        if (!result.success) {
          setError(result.error || 'Failed to delete journal')
          return
        }

        // Refresh journals list
        await fetchJournals()
      } catch (err: any) {
        setError(err.message || 'Failed to delete journal')
      }
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingJournal(null)
  }

  const handleModalSuccess = async () => {
    await fetchJournals()
    handleModalClose()
  }

  const handleCreate = async (journalData: any) => {
    const accessToken = await getAccessToken()
    const result = await createJournal(journalData, { accessToken })
    if (!result.success) {
      throw new Error(result.error || 'Failed to create journal')
    }
    return result.data
  }

  const handleUpdate = async (journalData: any) => {
    const accessToken = await getAccessToken()
    const result = await updateJournal(journalData, { accessToken })
    if (!result.success) {
      throw new Error(result.error || 'Failed to update journal')
    }
    return result.data
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Jurnal"
        description={`Kelola jurnal sistem (Total: ${total} jurnal)`}
        action={
          <button
            onClick={() => {
              setEditingJournal(null)
              setIsModalOpen(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jurnal Baru</span>
          </button>
        }
      />

      {error && <ErrorAlert message={error} />}

      <SearchBar
        placeholder="Cari berdasarkan nama jurnal atau ISSN..."
        value={search}
        onChange={setSearch}
      />

      <ContentCard>
        {loading || isPending ? (
          <LoadingSpinner message="Memuat data jurnal..." />
        ) : (
          <>
            <JournalTable
              journals={journals}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={fetchJournals}
            />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={goToPage}
              itemName="jurnal"
            />
          </>
        )}
      </ContentCard>

      <JournalFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        journal={editingJournal}
        editors={editors}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
