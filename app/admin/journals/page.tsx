'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useAdminList, useAdminCRUD } from '@/lib/admin/useAdminData'
import { usePagination } from '@/hooks/usePagination'
import JournalTable, { Journal } from '@/components/admin/JournalTable'
import JournalFormModal from '@/components/admin/JournalFormModal'
import PageHeader from '@/components/shared/PageHeader'
import SearchBar from '@/components/shared/SearchBar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Pagination from '@/components/shared/Pagination'
import ErrorAlert from '@/components/shared/ErrorAlert'
import ContentCard from '@/components/shared/ContentCard'
import { apiGet } from '@/lib/api/client'

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

  const {
    data: journals,
    loading,
    error,
    total,
    totalPages,
    refetch,
  } = useAdminList<Journal>('/api/admin/journals', search, 'jurnal', { page, limit, goToPage })

  const { create, update, remove } = useAdminCRUD<Journal>('/api/admin/journals')

  useEffect(() => {
    const fetchEditors = async () => {
      try {
        const result = await apiGet<{ editors: Editor[] }>('/api/admin/journals/editors')
        setEditors(result.editors || [])
      } catch (error) {
        console.error('Error fetching editors:', error)
      }
    }
    fetchEditors()
  }, [])

  const handleEdit = (journal: Journal) => {
    setEditingJournal(journal)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
      try {
        await remove(id)
        refetch()
      } catch (error) {
        // Error already handled by hook
      }
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingJournal(null)
  }

  const handleModalSuccess = async () => {
    refetch()
    handleModalClose()
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
        {loading ? (
          <LoadingSpinner message="Memuat data jurnal..." />
        ) : (
          <>
            <JournalTable
              journals={journals}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={refetch}
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
      />
    </div>
  )
}
