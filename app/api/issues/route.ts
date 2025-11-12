import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getIssues, createIssue, IssueInsert } from '@/lib/supabase/issueService'

/**
 * GET /api/issues - Get issues for current user's journal
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant and journal
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user is editor, section_editor, or super_admin
    const allowedRoles = ['editor', 'section_editor', 'super_admin']
    if (!allowedRoles.includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get journal for this tenant
    const { data: journal } = await supabase
      .from('journals')
      .select('id')
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as 'future' | 'back' || 'future'
    const search = searchParams.get('search') || ''

    const result = await getIssues(journal.id, status, page, limit, search)

    return NextResponse.json({
      issues: result.issues,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    })
  } catch (error: any) {
    console.error('Error fetching issues:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch issues' }, { status: 500 })
  }
}

/**
 * POST /api/issues - Create new issue
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant and journal
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user is editor, section_editor, or super_admin
    const allowedRoles = ['editor', 'section_editor', 'super_admin']
    if (!allowedRoles.includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get journal for this tenant
    const { data: journal } = await supabase
      .from('journals')
      .select('id')
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!journal) {
      return NextResponse.json({ error: 'Journal not found' }, { status: 404 })
    }

    const body = await request.json()
    const { volume, number, year, title, description, published_date, status, access_status } = body

    // Validation
    if (!year) {
      return NextResponse.json(
        { error: 'year is required' },
        { status: 400 }
      )
    }

    // Map status to is_published and published_date
    let is_published = false
    let finalPublishedDate = published_date || null

    if (status === 'published') {
      is_published = true
      if (!finalPublishedDate) {
        finalPublishedDate = new Date().toISOString()
      }
    } else if (status === 'scheduled') {
      is_published = false
      if (!finalPublishedDate) {
        return NextResponse.json(
          { error: 'published_date is required for scheduled status' },
          { status: 400 }
        )
      }
    } else {
      // draft
      is_published = false
      finalPublishedDate = null
    }

    const issueData: IssueInsert = {
      journal_id: journal.id,
      volume: volume || null,
      number: number || null,
      year,
      title: title || null,
      description: description || null,
      published_date: finalPublishedDate,
      is_published,
      access_status: access_status || 'open',
    }

    const issue = await createIssue(issueData)

    return NextResponse.json({ issue }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to create issue' }, { status: 500 })
  }
}

