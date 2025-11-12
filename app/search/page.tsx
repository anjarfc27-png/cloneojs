'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import ContentCard from '@/components/shared/ContentCard'
import { apiGet } from '@/lib/api/client'
import Link from 'next/link'

interface SearchResult {
  id: string
  title: string
  abstract?: string
  authors?: Array<{
    first_name: string
    last_name: string
  }>
  journal?: {
    id: string
    title: string
  }
  published_date?: string
  type: 'article' | 'submission'
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  limit: number
  total_pages: number
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (q) {
      performSearch(q, page)
    }
  }, [q, page])

  const performSearch = async (query: string, pageNum: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiGet<SearchResponse>(
        `/api/search?q=${encodeURIComponent(query)}&page=${pageNum}&limit=20`
      )
      setResults(response.results || [])
      setTotal(response.total || 0)
      setTotalPages(response.total_pages || 1)
    } catch (err: any) {
      setError(err.message || 'Failed to perform search')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('query') as string
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setPage(1)
    }
  }

  if (!q) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  name="query"
                  placeholder="Search articles..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#0056A1] text-white rounded-lg hover:bg-[#004494] transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
            <div className="text-center text-gray-500">
              <p>Enter a search query to find articles</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                name="query"
                defaultValue={q}
                placeholder="Search articles..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056A1]"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#0056A1] text-white rounded-lg hover:bg-[#004494] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Results */}
          {loading ? (
            <ContentCard>
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Searching...</p>
              </div>
            </ContentCard>
          ) : error ? (
            <ContentCard>
              <div className="text-center py-12 text-red-600">
                <p>{error}</p>
              </div>
            </ContentCard>
          ) : results.length === 0 ? (
            <ContentCard>
              <div className="text-center py-12 text-gray-500">
                <p>No results found for "{q}"</p>
              </div>
            </ContentCard>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Found {total} result{total !== 1 ? 's' : ''} for "{q}"
              </div>
              <div className="space-y-4">
                {results.map((result) => (
                  <ContentCard key={result.id}>
                    <Link href={`/article/${result.id}`}>
                      <h3 className="text-xl font-semibold text-[#0056A1] hover:underline mb-2">
                        {result.title}
                      </h3>
                    </Link>
                    {result.authors && result.authors.length > 0 && (
                      <div className="text-sm text-gray-600 mb-2">
                        By: {result.authors.map((a) => `${a.first_name} ${a.last_name}`).join(', ')}
                      </div>
                    )}
                    {result.journal && (
                      <div className="text-sm text-gray-600 mb-2">
                        Journal: {result.journal.title}
                      </div>
                    )}
                    {result.abstract && (
                      <p className="text-gray-700 mt-2 line-clamp-3">{result.abstract}</p>
                    )}
                    {result.published_date && (
                      <div className="text-xs text-gray-500 mt-2">
                        Published: {new Date(result.published_date).toLocaleDateString()}
                      </div>
                    )}
                  </ContentCard>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}

