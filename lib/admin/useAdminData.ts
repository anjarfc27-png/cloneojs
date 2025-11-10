/**
 * Custom hooks for admin data fetching
 */

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api/client'

interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useAdminList<T>(
  endpoint: string,
  searchTerm: string = '',
  itemName: string = 'item',
  customPagination?: { page: number; limit: number; goToPage: (page: number) => void }
) {
  const debouncedSearch = useDebounce(searchTerm, 500)
  const defaultPagination = usePagination({ initialPage: 1, initialLimit: 10 })
  const { page, limit, resetPage } = customPagination || defaultPagination

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      }
      if (debouncedSearch) {
        params.search = debouncedSearch
      }

      const result = await apiGet<PaginatedData<T>>(endpoint, params)
      setData(result.data || [])
      setTotal(result.total || 0)
      setTotalPages(result.totalPages || 1)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to fetch ' + itemName)
      }
      console.error(`Error fetching ${itemName}:`, err)
    } finally {
      setLoading(false)
    }
  }, [endpoint, page, limit, debouncedSearch, itemName])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (debouncedSearch !== searchTerm && searchTerm !== '') {
      resetPage()
    }
  }, [debouncedSearch, searchTerm, resetPage])

  return {
    data,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchData,
  }
}

export function useAdminCRUD<T extends { id: string }>(endpoint: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(
    async (data: Partial<T>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiPost<T>(endpoint, data)
        return result
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to create item')
        }
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  const update = useCallback(
    async (id: string, data: Partial<T>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiPut<T>(`${endpoint}/${id}`, data)
        return result
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to update item')
        }
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  const remove = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await apiDelete(`${endpoint}/${id}`)
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to delete item')
        }
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  return {
    create,
    update,
    remove,
    loading,
    error,
  }
}

