import { useState, useCallback } from 'react'

interface UsePaginationProps {
  initialPage?: number
  initialLimit?: number
  onPageChange?: (page: number) => void
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  onPageChange,
}: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(newPage)
      onPageChange?.(newPage)
    },
    [onPageChange]
  )

  const nextPage = useCallback(() => {
    setPage((prev) => {
      const newPage = prev + 1
      onPageChange?.(newPage)
      return newPage
    })
  }, [onPageChange])

  const prevPage = useCallback(() => {
    setPage((prev) => {
      const newPage = Math.max(1, prev - 1)
      onPageChange?.(newPage)
      return newPage
    })
  }, [onPageChange])

  const resetPage = useCallback(() => {
    setPage(1)
    onPageChange?.(1)
  }, [onPageChange])

  return {
    page,
    limit,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  }
}

