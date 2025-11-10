import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReviewForm from '@/components/reviews/ReviewForm'

export default async function ReviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth is handled by DashboardAuthGuard in layout
  // Get review assignment (only if user exists)
  const { data: review } = user ? await supabase
    .from('review_assignments')
    .select(`
      *,
      submissions:submission_id (
        *,
        journals:journal_id (
          title
        )
      )
    `)
    .eq('id', params.id)
    .eq('reviewer_id', user.id)
    .single() : { data: null }

  if (!review || !user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Review Submission</h1>
      <ReviewForm review={review} />
    </div>
  )
}

