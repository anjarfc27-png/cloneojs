import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/submissions/[id]/decision - Editor makes decision (accept/reject/revise)
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

    const body = await request.json()
    const { decision_type, comments } = body

    if (!decision_type) {
      return NextResponse.json(
        { error: 'decision_type is required' },
        { status: 400 }
      )
    }

    const validDecisions = ['accept', 'decline', 'revision', 'resubmit']
    if (!validDecisions.includes(decision_type)) {
      return NextResponse.json(
        { error: 'Invalid decision_type' },
        { status: 400 }
      )
    }

    // Get submission and verify editor access
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        *,
        journals:journal_id (
          *,
          tenants:tenant_id (
            *,
            tenant_users (*)
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if user is editor
    const isEditor = submission.journals?.tenants?.tenant_users?.some(
      (tu: any) => tu.user_id === user.id && 
      ['editor', 'section_editor', 'super_admin'].includes(tu.role)
    )

    if (!isEditor) {
      return NextResponse.json(
        { error: 'Only editors can make decisions' },
        { status: 403 }
      )
    }

    // Map decision to submission status
    const statusMap: Record<string, string> = {
      accept: 'accepted',
      decline: 'declined',
      revision: 'revision_requested',
      resubmit: 'submitted', // Reset to submitted for resubmission
    }

    const newStatus = statusMap[decision_type]

    // Update submission
    const updateData: any = {
      status: newStatus,
      editor_id: user.id,
      last_modified: new Date().toISOString(),
    }

    if (decision_type === 'revision') {
      updateData.current_round = (submission.current_round || 1) + 1
    }

    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create editorial decision record
    const { error: decisionError } = await supabase
      .from('editorial_decisions')
      .insert({
        submission_id: params.id,
        editor_id: user.id,
        decision_type,
        round: submission.current_round || 1,
        comments: comments || null,
      })

    if (decisionError) {
      console.error('Error creating decision record:', decisionError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

