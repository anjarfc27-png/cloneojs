import { useState, useEffect, useCallback } from 'react'

interface UseDataFetchOptions<T> {
  fetchFn: (params?: any) => Promise<{ data: T[]; total: number; totalPages: number }>
  dependencies?: any[]
  initialParams?: Record<string, any>
}

export function useDataFetch<T>({
  fetchFn,
  dependencies = [],
  initialParams = {},
}: UseDataFetchOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const fetchData = useCallback(
    async (params?: Record<string, any>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchFn({ ...initialParams, ...params })
        setData(result.data || [])
        setTotal(result.total || 0)
        setTotalPages(result.totalPages || 1)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    },
    [fetchFn, initialParams]
  )

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies])

  return {
    data,
    loading,
    error,
    total,
    totalPages,
    refetch: fetchData,
  }
}

