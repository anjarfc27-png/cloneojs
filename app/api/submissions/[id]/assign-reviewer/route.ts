import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/submissions/[id]/assign-reviewer - Assign reviewer to submission
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
    const { reviewer_id, review_due_date } = body

    if (!reviewer_id) {
      return NextResponse.json(
        { error: 'reviewer_id is required' },
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
        { error: 'Only editors can assign reviewers' },
        { status: 403 }
      )
    }

    // Verify reviewer exists and has reviewer role
    const { data: reviewer } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('user_id', reviewer_id)
      .eq('tenant_id', submission.journals.tenants.id)
      .eq('role', 'reviewer')
      .single()

    if (!reviewer) {
      return NextResponse.json(
        { error: 'Reviewer not found or does not have reviewer role' },
        { status: 404 }
      )
    }

    // Update submission status to under_review if not already
    if (submission.status === 'submitted') {
      await supabase
        .from('submissions')
        .update({ status: 'under_review' })
        .eq('id', params.id)
    }

    // Create review assignment
    const { data: reviewAssignment, error } = await supabase
      .from('review_assignments')
      .insert({
        submission_id: params.id,
        reviewer_id,
        editor_id: user.id,
        round: submission.current_round || 1,
        status: 'pending',
        review_due_date: review_due_date || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reviewAssignment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

