import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/reviews/[id]/complete - Complete review
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
    const { recommendation, comments, review_form_data } = body

    if (!recommendation) {
      return NextResponse.json(
        { error: 'recommendation is required' },
        { status: 400 }
      )
    }

    // Get review assignment
    const { data: reviewAssignment, error: fetchError } = await supabase
      .from('review_assignments')
      .select('*')
      .eq('id', params.id)
      .eq('reviewer_id', user.id)
      .single()

    if (fetchError || !reviewAssignment) {
      return NextResponse.json(
        { error: 'Review assignment not found' },
        { status: 404 }
      )
    }

    if (reviewAssignment.status === 'completed') {
      return NextResponse.json(
        { error: 'Review already completed' },
        { status: 400 }
      )
    }

    // Update review assignment
    const { data: updatedReview, error } = await supabase
      .from('review_assignments')
      .update({
        status: 'completed',
        recommendation,
        review_completed_date: new Date().toISOString(),
        review_form_data: review_form_data || {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if all reviews are completed
    const { data: allReviews } = await supabase
      .from('review_assignments')
      .select('status')
      .eq('submission_id', reviewAssignment.submission_id)
      .eq('round', reviewAssignment.round)

    const allCompleted = allReviews?.every((r) => r.status === 'completed')

    if (allCompleted) {
      // Update submission status to review_completed
      await supabase
        .from('submissions')
        .update({ status: 'review_completed' })
        .eq('id', reviewAssignment.submission_id)
    }

    return NextResponse.json({ review: updatedReview })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

