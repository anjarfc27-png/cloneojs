/**
 * Users Page (Using Server Actions)
 * 
 * This page uses Server Actions instead of API routes for better performance and security.
 */

'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
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
import { useSupabaseAccessToken } from '@/lib/admin/useSupabaseAccessToken'

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
  const retrySetupRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventListenerRef = useRef<((event: CustomEvent) => void) | null>(null)
  const lastErrorRef = useRef<string | null>(null)
  const getAccessToken = useSupabaseAccessToken()

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const accessToken = await getAccessToken()
      const result = await getUsers({
        page,
        limit,
        search,
        accessToken,
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
        // Success - error already cleared above
        console.log('[UsersPage] ✅ Successfully fetched users:', result.data.total)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchUsers()
  }, [page, limit, search])

  // Auto retry mechanism - setup once on mount
  useEffect(() => {
    const handleAuthComplete = () => {
      console.log('[UsersPage] Client-side auth complete, retrying fetch...')
      // Clear any existing retry interval
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
        retryIntervalRef.current = null
      }
      // Reset retry count
      retryCountRef.current = 0
      // Immediate retry after auth complete
      setTimeout(() => {
        fetchUsers()
      }, 300)
    }

    // Store event listener ref for cleanup
    eventListenerRef.current = handleAuthComplete as any

    // Listen for auth complete event (only setup once)
    if (typeof window !== 'undefined') {
      window.addEventListener('admin-auth-complete', eventListenerRef.current)
    }

    return () => {
      if (typeof window !== 'undefined' && eventListenerRef.current) {
        window.removeEventListener('admin-auth-complete', eventListenerRef.current)
        eventListenerRef.current = null
      }
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
        retryIntervalRef.current = null
      }
    }
  }, []) // Only setup once on mount

  // Handle Unauthorized error with retry
  useEffect(() => {
    const currentError = error || null
    
    // Only setup retry if we have Unauthorized error AND haven't setup yet
    if (!currentError || !currentError.includes('Unauthorized')) {
      // Clear any existing retry if error is cleared
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current)
        retryIntervalRef.current = null
      }
      retrySetupRef.current = false
      retryCountRef.current = 0
      lastErrorRef.current = currentError
      return
    }

    // Prevent re-setup if error is the same and already setup
    if (lastErrorRef.current === currentError && (retrySetupRef.current || retryIntervalRef.current)) {
      return
    }

    // Prevent multiple setups - check both refs
    if (retrySetupRef.current || retryIntervalRef.current) {
      return
    }

    // Mark as setup to prevent multiple setups
    retrySetupRef.current = true
    retryCountRef.current = 0
    lastErrorRef.current = currentError

    const maxRetries = 5

    console.log('[UsersPage] Unauthorized error detected, starting auto-retry...')
    
    const doRetry = async () => {
      // Check if interval still exists (might be cleared)
      if (!retryIntervalRef.current) return
      
      retryCountRef.current++
      console.log(`[UsersPage] Auto-retry attempt ${retryCountRef.current}/${maxRetries}...`)
      
      try {
        await fetchUsers()
      } catch (err) {
        console.error('[UsersPage] Retry error:', err)
      }
      
      if (retryCountRef.current >= maxRetries) {
        if (retryIntervalRef.current) {
          clearInterval(retryIntervalRef.current)
          retryIntervalRef.current = null
        }
        retrySetupRef.current = false
        console.error('[UsersPage] Max retry attempts reached')
      }
    }
    
    // First retry immediately
    doRetry()
    
    // Then retry every 1 second
    retryIntervalRef.current = setInterval(doRetry, 1000)

    // No cleanup here - cleanup is handled by the check above
  }, [error]) // Only depend on error

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
        const accessToken = await getAccessToken()
        const result = await deleteUser({ id }, { accessToken })

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
    const accessToken = await getAccessToken()
    const result = await createUser(userData, { accessToken })
    if (!result.success) {
      throw new Error(result.error || 'Failed to create user')
    }
    return result.data
  }

  const handleUpdate = async (userData: any) => {
    const accessToken = await getAccessToken()
    const result = await updateUser(userData, { accessToken })
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
