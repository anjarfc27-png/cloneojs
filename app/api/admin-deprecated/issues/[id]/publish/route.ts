import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { publishIssue } from '@/lib/supabase/issueService'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * POST /api/admin/issues/[id]/publish - Publish issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }

    const issue = await publishIssue(params.id)

    return NextResponse.json({ issue })
  } catch (error: any) {
    console.error('Error publishing issue:', error)
    return NextResponse.json({ error: error.message || 'Failed to publish issue' }, { status: 500 })
  }
}

