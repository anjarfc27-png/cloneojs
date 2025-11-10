'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAdminList, useAdminCRUD } from '@/lib/admin/useAdminData'
import { usePagination } from '@/hooks/usePagination'
import UserTable, { User } from '@/components/admin/UserTable'
import UserFormModal from '@/components/admin/UserFormModal'
import PageHeader from '@/components/shared/PageHeader'
import SearchBar from '@/components/shared/SearchBar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Pagination from '@/components/shared/Pagination'
import ErrorAlert from '@/components/shared/ErrorAlert'
import ContentCard from '@/components/shared/ContentCard'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const {
    data: users,
    loading,
    error,
    total,
    totalPages,
    refetch,
  } = useAdminList<User>('/api/admin/users', search, 'pengguna', { page, limit, goToPage })

  const { create, update, remove } = useAdminCRUD<User>('/api/admin/users')

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
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
    setEditingUser(null)
  }

  const handleModalSuccess = async () => {
    refetch()
    handleModalClose()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna"
        description={`Kelola pengguna sistem (Total: ${total} pengguna)`}
        action={
          <button
            onClick={() => {
              setEditingUser(null)
              setIsModalOpen(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0056A1] text-white rounded-md hover:bg-[#003d5c] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </button>
        }
      />

      {error && <ErrorAlert message={error} />}

      <SearchBar
        placeholder="Cari berdasarkan nama atau email..."
        value={search}
        onChange={setSearch}
      />

      <ContentCard>
        {loading ? (
          <LoadingSpinner message="Memuat data pengguna..." />
        ) : (
          <>
            <UserTable
              users={users}
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
              itemName="pengguna"
            />
          </>
        )}
      </ContentCard>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        user={editingUser}
      />
    </div>
  )
}
