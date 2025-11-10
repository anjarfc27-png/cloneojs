'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ReviewDecisionFormProps {
  submissionId: string
}

export default function ReviewDecisionForm({ submissionId }: ReviewDecisionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    decision_type: '',
    comments: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.decision_type) {
      setError('Please select a decision')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/submissions/${submissionId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision_type: formData.decision_type,
          comments: formData.comments || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make decision')
      }

      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ojs-card">
      <h2 className="text-xl font-bold text-[var(--ojs-primary)] mb-4">
        Editorial Decision
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Decision *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="decision_type"
                value="accept"
                checked={formData.decision_type === 'accept'}
                onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}
                className="mr-2"
              />
              <span className="text-green-700 font-semibold">Accept</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="decision_type"
                value="revision"
                checked={formData.decision_type === 'revision'}
                onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}
                className="mr-2"
              />
              <span className="text-orange-700 font-semibold">Request Revision</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="decision_type"
                value="decline"
                checked={formData.decision_type === 'decline'}
                onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}
                className="mr-2"
              />
              <span className="text-red-700 font-semibold">Decline</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="decision_type"
                value="resubmit"
                checked={formData.decision_type === 'resubmit'}
                onChange={(e) => setFormData({ ...formData, decision_type: e.target.value })}
                className="mr-2"
              />
              <span className="text-blue-700 font-semibold">Resubmit for Review</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
            Comments (Optional)
          </label>
          <textarea
            id="comments"
            rows={4}
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            placeholder="Add comments about your decision..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.decision_type}
            className="ojs-button-primary disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Submit Decision'}
          </button>
        </div>
      </form>
    </div>
  )
}

