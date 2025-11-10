'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Review {
  id: string
  status: string
  recommendation?: string
  review_due_date?: string
  submissions?: {
    id: string
    title: string
    abstract?: string
    journals?: {
      title: string
    }
  }
}

interface ReviewFormProps {
  review: Review
}

export default function ReviewForm({ review }: ReviewFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    recommendation: review.recommendation || '',
    comments: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.recommendation) {
      setError('Please select a recommendation')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/reviews/${review.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendation: formData.recommendation,
          comments: formData.comments || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      router.push('/dashboard/reviews')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (review.status === 'completed') {
    return (
      <div className="ojs-card">
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <p className="text-green-800 font-semibold">Review sudah diselesaikan</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Recommendation</label>
            <p className="text-gray-900">{review.recommendation}</p>
          </div>
          <div>
            <Link
              href="/dashboard/reviews"
              className="ojs-button-secondary"
            >
              ← Kembali ke Reviews
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ojs-card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--ojs-primary)] mb-2">
          {review.submissions?.title}
        </h2>
        <p className="text-gray-600">
          Journal: {review.submissions?.journals?.title}
        </p>
        {review.review_due_date && (
          <p className="text-sm text-gray-600 mt-2">
            Due Date: {new Date(review.review_due_date).toLocaleDateString('id-ID')}
          </p>
        )}
      </div>

      {review.submissions?.abstract && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Abstract</h3>
          <p className="text-gray-700 whitespace-pre-line">{review.submissions.abstract}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Recommendation *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="accept"
                checked={formData.recommendation === 'accept'}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="mr-2"
              />
              <span className="text-green-700 font-semibold">Accept</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="minor_revision"
                checked={formData.recommendation === 'minor_revision'}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="mr-2"
              />
              <span className="text-orange-700 font-semibold">Minor Revision</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="major_revision"
                checked={formData.recommendation === 'major_revision'}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="mr-2"
              />
              <span className="text-orange-700 font-semibold">Major Revision</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="reject"
                checked={formData.recommendation === 'reject'}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="mr-2"
              />
              <span className="text-red-700 font-semibold">Reject</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="resubmit"
                checked={formData.recommendation === 'resubmit'}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                className="mr-2"
              />
              <span className="text-blue-700 font-semibold">Resubmit</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Review Comments
          </label>
          <textarea
            id="comments"
            rows={8}
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            placeholder="Provide your review comments here..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/reviews"
            className="ojs-button-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.recommendation}
            className="ojs-button-primary disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  )
}

