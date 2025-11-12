import { NextRequest, NextResponse } from 'next/server'
import { getSearchSuggestions } from '@/lib/search/search'

/**
 * GET /api/search/suggestions
 * Get search suggestions for autocomplete
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        suggestions: [],
      })
    }

    const suggestions = await getSearchSuggestions(q, limit)

    return NextResponse.json({
      suggestions,
    })
  } catch (error: any) {
    console.error('Error in GET /api/search/suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

