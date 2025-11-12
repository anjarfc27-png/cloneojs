/**
 * Users Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { usePagination } from '@/hooks/usePagination'
import UserTable, { User } from '@/components/admin/UserTable'
import UserFormModal from '@/components/admin/UserFormModal'
import PageHeader from '@/components/shared/PageHeader'
import SearchBar from '@/components/shared/SearchBar'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import Pagination from '@/components/shared/Pagination'
import ErrorAlert from '@/components/shared/ErrorAlert'
import ContentCard from '@/components/shared/ContentCard'
import { getUsers, UserWithRoles } from '@/actions/users/get'
import { createUser } from '@/actions/users/create'
import { updateUser } from '@/actions/users/update'
import { deleteUser } from '@/actions/users/delete'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const { page, limit, goToPage } = usePagination({ initialPage: 1, initialLimit: 10 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getUsers({
        page,
        limit,
        search,
      })

      if (!result.success) {
        setError(result.error || 'Failed to fetch users')
        return
      }

      if (result.data) {
        // Transform UserWithRoles to User format
        const transformedUsers: User[] = result.data.users.map((u: UserWithRoles) => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.roles[0]?.role_key || 'reader', // Primary role
          is_active: u.is_active,
          created_at: u.created_at,
          tenant_id: u.roles[0]?.tenant_id,
          tenant_name: u.roles[0]?.tenant_name || undefined,
        }))

        setUsers(transformedUsers)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, limit, search])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      return
    }

    startTransition(async () => {
      try {
        const result = await deleteUser({ id })

        if (!result.success) {
          setError(result.error || 'Failed to delete user')
          return
        }

        // Refresh users list
        await fetchUsers()
      } catch (err: any) {
        setError(err.message || 'Failed to delete user')
      }
    })
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleModalSuccess = async () => {
    await fetchUsers()
    handleModalClose()
  }

  const handleCreate = async (userData: any) => {
    const result = await createUser(userData)
    if (!result.success) {
      throw new Error(result.error || 'Failed to create user')
    }
    return result.data
  }

  const handleUpdate = async (userData: any) => {
    const result = await updateUser(userData)
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user')
    }
    return result.data
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
        {loading || isPending ? (
          <LoadingSpinner message="Memuat data pengguna..." />
        ) : (
          <>
            <UserTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={fetchUsers}
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
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
