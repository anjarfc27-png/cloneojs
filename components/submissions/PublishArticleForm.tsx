'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface PublishArticleFormProps {
  submissionId: string
  journalId: string
}

export default function PublishArticleForm({ submissionId, journalId }: PublishArticleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [formData, setFormData] = useState({
    issue_id: '',
    volume: '',
    issue: '',
    year: new Date().getFullYear().toString(),
    pages: '',
    doi: '',
  })

  useEffect(() => {
    // Fetch available issues
    const fetchIssues = async () => {
      try {
        const response = await fetch(`/api/issues?journalId=${journalId}`)
        const data = await response.json()
        if (data.issues) {
          setIssues(data.issues)
        }
      } catch (error) {
        console.error('Error fetching issues:', error)
      }
    }
    fetchIssues()
  }, [journalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`/api/submissions/${submissionId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issue_id: formData.issue_id || null,
          volume: formData.volume ? parseInt(formData.volume) : null,
          issue: formData.issue ? parseInt(formData.issue) : null,
          year: formData.year ? parseInt(formData.year) : null,
          pages: formData.pages || null,
          doi: formData.doi || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to publish article')
      }

      router.push(`/article/${data.article.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ojs-card bg-green-50 border-green-200">
      <h2 className="text-xl font-bold text-[var(--ojs-primary)] mb-4">
        Publish Article
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="issue_id" className="block text-sm font-medium text-gray-700 mb-2">
              Issue (Optional)
            </label>
            <select
              id="issue_id"
              value={formData.issue_id}
              onChange={(e) => setFormData({ ...formData, issue_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            >
              <option value="">-- Pilih Issue --</option>
              {issues.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  Vol. {issue.volume}, No. {issue.number} ({issue.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <input
              type="number"
              id="year"
              required
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="volume" className="block text-sm font-medium text-gray-700 mb-2">
              Volume (Optional)
            </label>
            <input
              type="number"
              id="volume"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            />
          </div>

          <div>
            <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-2">
              Issue Number (Optional)
            </label>
            <input
              type="number"
              id="issue"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pages" className="block text-sm font-medium text-gray-700 mb-2">
              Pages (Optional)
            </label>
            <input
              type="text"
              id="pages"
              value={formData.pages}
              onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
              placeholder="e.g., 1-10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            />
          </div>

          <div>
            <label htmlFor="doi" className="block text-sm font-medium text-gray-700 mb-2">
              DOI (Optional)
            </label>
            <input
              type="text"
              id="doi"
              value={formData.doi}
              onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
              placeholder="10.xxxx/xxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ojs-primary)]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="ojs-button-primary bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Publish Article'}
          </button>
        </div>
      </form>
    </div>
  )
}

