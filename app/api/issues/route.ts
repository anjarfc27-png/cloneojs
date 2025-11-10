import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/issues - Get issues for a journal
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get('journalId')

    if (!journalId) {
      return NextResponse.json(
        { error: 'journalId is required' },
        { status: 400 }
      )
    }

    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .eq('journal_id', journalId)
      .eq('is_published', true)
      .order('published_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ issues })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

