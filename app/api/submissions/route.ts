import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/submissions - Get user's submissions
 * POST /api/submissions - Create new submission
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const journalId = searchParams.get('journalId')
    const status = searchParams.get('status')

    let query = supabase
      .from('submissions')
      .select(`
        *,
        journals:journal_id (
          id,
          title
        ),
        sections:section_id (
          id,
          title
        )
      `)
      .eq('submitter_id', user.id)

    if (journalId) {
      query = query.eq('journal_id', journalId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: submissions, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submissions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { journal_id, section_id, title, abstract, keywords } = body

    if (!journal_id || !title) {
      return NextResponse.json(
        { error: 'journal_id and title are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this journal
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('*, tenants:tenant_id (journals:journals!tenant_id (*))')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const hasAccess = tenantUser?.tenants?.journals?.some(
      (j: any) => j.id === journal_id
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this journal' },
        { status: 403 }
      )
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        journal_id,
        section_id: section_id || null,
        submitter_id: user.id,
        title,
        abstract: abstract || null,
        keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',').map((k: string) => k.trim())) : null,
        status: 'draft',
        current_round: 1,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

