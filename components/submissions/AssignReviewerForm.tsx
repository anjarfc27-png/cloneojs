'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Reviewer {
  id: string
  users?: {
    id: string
    email: string
  }
}

interface AssignReviewerFormProps {
  submissionId: string
  reviewers: Reviewer[]
}

export default function AssignReviewerForm({ submissionId, reviewers }: AssignReviewerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    reviewer_id: '',
    review_due_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/submissions/${submissionId}/assign-reviewer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewer_id: formData.reviewer_id,
          review_due_date: formData.review_due_date || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign reviewer')
      }

      router.refresh()
      setFormData({ reviewer_id: '', review_due_date: '' })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ojs-card">
      <h2 className="text-xl font-bold text-[var(--ojs-primary)] mb-4">
        Assign Reviewer
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reviewer_id" className="block text-sm font-medium text-gray-700 mb-2">
            Select Reviewer *
          </label>
          <select
            id="reviewer_id"
            required
            value={formData.reviewer_id}
            onChange={(e) => setFormData({ ...formData, reviewer_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
          >
            <option value="">-- Pilih Reviewer --</option>
            {reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.users?.id}>
                {reviewer.users?.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="review_due_date" className="block text-sm font-medium text-gray-700 mb-2">
            Review Due Date (Optional)
          </label>
          <input
            type="date"
            id="review_due_date"
            value={formData.review_due_date}
            onChange={(e) => setFormData({ ...formData, review_due_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="ojs-button-primary disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Reviewer'}
          </button>
        </div>
      </form>
    </div>
  )
}

