'use client'

import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Submission {
  id: string
  title: string
  abstract?: string
  keywords?: string[]
  status: string
  submission_date?: string
  created_at: string
  current_round: number
  journals?: {
    title: string
  }
  sections?: {
    title: string
  }
  submission_authors?: Array<{
    first_name: string
    last_name: string
    email: string
    affiliation?: string
  }>
  submission_files?: Array<{
    id: string
    file_name: string
    file_type: string
    google_drive_files?: {
      web_view_link: string
    }
  }>
  review_assignments?: Array<{
    id: string
    status: string
    recommendation?: string
    reviewers?: {
      email: string
    }
  }>
}

interface SubmissionDetailProps {
  submission: Submission
  isAuthor: boolean
  isEditor: boolean
}

export default function SubmissionDetail({ submission, isAuthor, isEditor }: SubmissionDetailProps) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    review_completed: 'bg-purple-100 text-purple-800',
    revision_requested: 'bg-orange-100 text-orange-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    published: 'bg-green-100 text-green-800',
  }

  return (
    <div className="ojs-card">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--ojs-primary)] mb-2">
            {submission.title}
          </h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Status: <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[submission.status] || 'bg-gray-100 text-gray-800'}`}>
                {submission.status}
              </span>
            </span>
            {submission.submission_date && (
              <span>Submitted: {formatDate(submission.submission_date)}</span>
            )}
            <span>Round: {submission.current_round}</span>
          </div>
        </div>
        <Link
          href="/dashboard/submissions"
          className="ojs-button-secondary"
        >
          ← Kembali
        </Link>
      </div>

      {/* Journal & Section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Journal</label>
            <p className="text-gray-900">{submission.journals?.title}</p>
          </div>
          {submission.sections && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Section</label>
              <p className="text-gray-900">{submission.sections.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Authors */}
      {submission.submission_authors && submission.submission_authors.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Authors</h2>
          <div className="space-y-2">
            {submission.submission_authors.map((author, idx) => (
              <div key={idx} className="border-l-4 border-[var(--ojs-primary)] pl-4">
                <p className="font-semibold">{author.first_name} {author.last_name}</p>
                <p className="text-sm text-gray-600">{author.email}</p>
                {author.affiliation && (
                  <p className="text-sm text-gray-600">{author.affiliation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abstract */}
      {submission.abstract && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Abstract</h2>
          <p className="text-gray-700 whitespace-pre-line">{submission.abstract}</p>
        </div>
      )}

      {/* Keywords */}
      {submission.keywords && submission.keywords.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {submission.keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {submission.submission_files && submission.submission_files.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Files</h2>
          <div className="space-y-2">
            {submission.submission_files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{file.file_name}</p>
                  <p className="text-sm text-gray-600">{file.file_type}</p>
                </div>
                {file.google_drive_files?.web_view_link && (
                  <a
                    href={file.google_drive_files.web_view_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ojs-button-primary text-sm"
                  >
                    View PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Assignments (Editor only) */}
      {isEditor && submission.review_assignments && submission.review_assignments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Review Assignments</h2>
          <div className="space-y-3">
            {submission.review_assignments.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      Reviewer: {review.reviewers?.email || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-semibold">{review.status}</span>
                    </p>
                    {review.recommendation && (
                      <p className="text-sm text-gray-600">
                        Recommendation: <span className="font-semibold">{review.recommendation}</span>
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/reviews/${review.id}`}
                    className="text-[var(--ojs-primary)] hover:underline text-sm"
                  >
                    View Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

