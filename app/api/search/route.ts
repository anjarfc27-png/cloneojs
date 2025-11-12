import { NextRequest, NextResponse } from 'next/server'
import { search, SearchOptions } from '@/lib/search/search'

/**
 * GET /api/search
 * Full-text search endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const options: SearchOptions = {
      q: searchParams.get('q') || '',
      type: (searchParams.get('type') as 'articles' | 'submissions' | 'all') || 'articles',
      journal_id: searchParams.get('journal_id') || undefined,
      author: searchParams.get('author') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sort: (searchParams.get('sort') as 'relevance' | 'date' | 'title') || 'relevance',
    }

    if (!options.q || options.q.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    const results = await search(options)

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error in GET /api/search:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

