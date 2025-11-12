import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishIssue, getIssueById } from '@/lib/supabase/issueService'

/**
 * POST /api/issues/[id]/publish - Publish issue
 */
export async function POST(
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

    const publishedIssue = await publishIssue(params.id)

    return NextResponse.json({ issue: publishedIssue })
  } catch (error: any) {
    console.error('Error publishing issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to publish issue' }, { status: 500 })
  }
}






