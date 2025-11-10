import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishIssue } from '@/lib/supabase/issueService'

/**
 * POST /api/admin/issues/[id]/publish - Publish issue
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

    const issue = await publishIssue(params.id)

    return NextResponse.json({ issue })
  } catch (error: any) {
    console.error('Error publishing issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to publish issue' }, { status: 500 })
  }
}

