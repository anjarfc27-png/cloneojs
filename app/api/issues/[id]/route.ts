import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateIssue, deleteIssue, getIssueById } from '@/lib/supabase/issueService'

/**
 * PUT /api/issues/[id] - Update issue
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get issue and verify it belongs to user's journal
    const issue = await getIssueById(params.id)
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Get journal for this tenant
    const { data: journal } = await supabase
      .from('journals')
      .select('id')
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!journal || issue.journal_id !== journal.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { volume, number, year, title, description, published_date, status, access_status } = body

    // Map status to is_published and published_date
    let is_published = issue.is_published
    let finalPublishedDate = published_date !== undefined ? published_date : issue.published_date

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
    } else if (status === 'draft') {
      is_published = false
      finalPublishedDate = null
    }

    const updatedIssue = await updateIssue(params.id, {
      volume: volume !== undefined ? volume : issue.volume,
      number: number !== undefined ? number : issue.number,
      year: year !== undefined ? year : issue.year,
      title: title !== undefined ? title : issue.title,
      description: description !== undefined ? description : issue.description,
      published_date: finalPublishedDate,
      is_published,
      access_status: access_status || issue.access_status,
    })

    return NextResponse.json({ issue: updatedIssue })
  } catch (error: any) {
    console.error('Error updating issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to update issue' }, { status: 500 })
  }
}

/**
 * DELETE /api/issues/[id] - Delete issue
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get issue and verify it belongs to user's journal
    const issue = await getIssueById(params.id)
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Get journal for this tenant
    const { data: journal } = await supabase
      .from('journals')
      .select('id')
      .eq('tenant_id', tenantUser.tenant_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!journal || issue.journal_id !== journal.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteIssue(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete issue' }, { status: 500 })
  }
}











