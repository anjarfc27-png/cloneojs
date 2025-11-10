import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth is handled by DashboardAuthGuard in layout
  // Get review assignments for this user (only if user exists)
  const { data: reviews } = user ? await supabase
    .from('review_assignments')
    .select(`
      *,
      submissions:submission_id (
        id,
        title,
        journals:journal_id (
          id,
          title
        )
      )
    `)
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false }) : { data: null }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Peer Reviews</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {reviews && reviews.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jurnal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Round
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review: any) => (
                <tr key={review.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {review.submissions && !Array.isArray(review.submissions)
                        ? review.submissions.title
                        : Array.isArray(review.submissions) && review.submissions[0]?.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {review.submissions && !Array.isArray(review.submissions) && review.submissions.journals
                        ? (Array.isArray(review.submissions.journals) 
                            ? review.submissions.journals[0]?.title 
                            : review.submissions.journals.title)
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      review.status === 'completed' ? 'bg-green-100 text-green-800' :
                      review.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      review.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      review.status === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Round {review.round}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {review.review_due_date
                      ? new Date(review.review_due_date).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dashboard/reviews/${review.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {review.status === 'pending' ? 'Review' : 'Lihat'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Belum ada review assignment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

