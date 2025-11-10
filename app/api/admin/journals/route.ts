import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/journals - Get all journals with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Get all journals with tenant info
    let query = supabase
      .from('journals')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    const { data: journals, error } = await query

    if (error) {
      console.error('Error fetching journals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get editor information for each journal
    // For now, we'll get editors from tenant_users with role 'editor' for each tenant
    const tenantIds = [...new Set(journals?.map((j: any) => j.tenant_id) || [])]
    
    const { data: tenantEditors } = await supabase
      .from('tenant_users')
      .select('user_id, tenant_id, role')
      .in('tenant_id', tenantIds)
      .eq('role', 'editor')
      .eq('is_active', true)

    // Create a map of tenant_id to editor
    const editorMap = new Map()
    tenantEditors?.forEach((te: any) => {
      if (!editorMap.has(te.tenant_id)) {
        editorMap.set(te.tenant_id, te.user_id)
      }
    })

    // Build journals array with editor info
    let journalsWithEditor = journals?.map((journal: any) => {
      const editorId = editorMap.get(journal.tenant_id)
      return {
        id: journal.id,
        title: journal.title,
        description: journal.description,
        issn: journal.issn,
        e_issn: journal.e_issn,
        editor_id: editorId || null,
        editor_name: null, // Will be populated if we can get user metadata
        is_active: journal.is_active,
        created_at: journal.created_at,
        tenant_id: journal.tenant_id,
        tenant_name: journal.tenants?.name || null,
      }
    }) || []

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      journalsWithEditor = journalsWithEditor.filter(
        (j: any) =>
          j.title?.toLowerCase().includes(searchLower) ||
          j.issn?.toLowerCase().includes(searchLower) ||
          j.e_issn?.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedJournals = journalsWithEditor.slice(start, end)

    return NextResponse.json({
      journals: paginatedJournals,
      total: journalsWithEditor.length,
      page,
      limit,
      totalPages: Math.ceil(journalsWithEditor.length / limit),
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/journals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/journals - Create a new journal
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, issn, e_issn, editor_id, is_active, tenant_id } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Use tenant_id from body or default to super admin's tenant
    const journalTenantId = tenant_id || tenantUser.tenant_id

    // Create journal
    const { data: journal, error } = await supabase
      .from('journals')
      .insert({
        title,
        description: description || null,
        issn: issn || null,
        e_issn: e_issn || null,
        tenant_id: journalTenantId,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating journal:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Journal created successfully',
      journal,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/journals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

