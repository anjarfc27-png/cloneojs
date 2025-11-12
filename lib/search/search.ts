/**
 * Full-text search implementation using PostgreSQL
 */

import { createClient } from '@/lib/supabase/server'

export interface SearchOptions {
  query: string
  type?: 'articles' | 'submissions' | 'all'
  journal?: string
  author?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'date' | 'title'
}

export interface SearchResult {
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
  relevance?: number
  type: 'article' | 'submission'
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  limit: number
  pages: number
}

/**
 * Perform full-text search
 */
export async function search(options: SearchOptions): Promise<SearchResponse> {
  const supabase = await createClient()
  const {
    query,
    type = 'articles',
    journal,
    author,
    dateFrom,
    dateTo,
    page = 1,
    limit = 10,
    sortBy = 'relevance',
  } = options

  if (!query || query.trim().length === 0) {
    return {
      results: [],
      total: 0,
      page,
      limit,
      pages: 0,
    }
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const results: SearchResult[] = []

  // Search articles
  if (type === 'articles' || type === 'all') {
    let articleQuery = supabase
      .from('articles')
      .select(`
        id,
        title,
        abstract,
        published_date,
        search_vector,
        journals:journal_id (
          id,
          title
        ),
        article_authors (
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english',
      })

    if (journal) {
      articleQuery = articleQuery.eq('journal_id', journal)
    }

    if (dateFrom) {
      articleQuery = articleQuery.gte('published_date', dateFrom)
    }

    if (dateTo) {
      articleQuery = articleQuery.lte('published_date', dateTo)
    }

    // Filter by author if provided
    if (author) {
      // This would require a join or subquery
      // For now, we'll filter after fetching
    }

    // Order by
    if (sortBy === 'date') {
      articleQuery = articleQuery.order('published_date', { ascending: false })
    } else if (sortBy === 'title') {
      articleQuery = articleQuery.order('title', { ascending: true })
    } else {
      // Relevance is handled by textSearch
      articleQuery = articleQuery.order('published_date', { ascending: false })
    }

    // Pagination
    articleQuery = articleQuery.range(from, to)

    const { data: articles, error: articlesError, count: articlesCount } = await articleQuery

    if (!articlesError && articles) {
      results.push(
        ...articles.map((article: any) => ({
          id: article.id,
          title: article.title,
          abstract: article.abstract,
          authors: article.article_authors || [],
          journal: article.journals,
          published_date: article.published_date,
          type: 'article' as const,
        }))
      )
    }
  }

  // Search submissions (if type is 'submissions' or 'all')
  if (type === 'submissions' || type === 'all') {
    let submissionQuery = supabase
      .from('submissions')
      .select(`
        id,
        title,
        abstract,
        created_at,
        search_vector,
        journals:journal_id (
          id,
          title
        ),
        submission_authors (
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .textSearch('search_vector', query, {
        type: 'websearch',
        config: 'english',
      })

    if (journal) {
      submissionQuery = submissionQuery.eq('journal_id', journal)
    }

    if (dateFrom) {
      submissionQuery = submissionQuery.gte('created_at', dateFrom)
    }

    if (dateTo) {
      submissionQuery = submissionQuery.lte('created_at', dateTo)
    }

    // Order by
    if (sortBy === 'date') {
      submissionQuery = submissionQuery.order('created_at', { ascending: false })
    } else if (sortBy === 'title') {
      submissionQuery = submissionQuery.order('title', { ascending: true })
    } else {
      submissionQuery = submissionQuery.order('created_at', { ascending: false })
    }

    // Pagination
    submissionQuery = submissionQuery.range(from, to)

    const { data: submissions, error: submissionsError, count: submissionsCount } = await submissionQuery

    if (!submissionsError && submissions) {
      results.push(
        ...submissions.map((submission: any) => ({
          id: submission.id,
          title: submission.title,
          abstract: submission.abstract,
          authors: submission.submission_authors || [],
          journal: submission.journals,
          published_date: submission.created_at,
          type: 'submission' as const,
        }))
      )
    }
  }

  // Calculate total (simplified - in production, you might want to get actual counts)
  const total = results.length

  return {
    results,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  }
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  const supabase = await createClient()

  if (!query || query.trim().length < 2) {
    return []
  }

  // Get suggestions from article titles
  const { data: articles } = await supabase
    .from('articles')
    .select('title')
    .ilike('title', `%${query}%`)
    .limit(limit)

  // Get suggestions from keywords
  const { data: articlesWithKeywords } = await supabase
    .from('articles')
    .select('keywords')
    .not('keywords', 'is', null)
    .limit(limit * 2)

  const suggestions = new Set<string>()

  // Add titles
  articles?.forEach(article => {
    if (article.title) {
      suggestions.add(article.title)
    }
  })

  // Add keywords
  articlesWithKeywords?.forEach(article => {
    if (article.keywords && Array.isArray(article.keywords)) {
      article.keywords.forEach(keyword => {
        if (keyword.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(keyword)
        }
      })
    }
  })

  return Array.from(suggestions).slice(0, limit)
}
