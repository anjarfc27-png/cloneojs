import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/submissions/[id]/submit - Submit submission for review
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

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', params.id)
      .eq('submitter_id', user.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.status !== 'draft') {
      return NextResponse.json(
        { error: 'Submission already submitted' },
        { status: 400 }
      )
    }

    // Update submission status
    const { data: updatedSubmission, error } = await supabase
      .from('submissions')
      .update({
        status: 'submitted',
        submission_date: new Date().toISOString(),
        last_modified: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

