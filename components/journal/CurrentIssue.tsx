import Link from 'next/link'

interface Issue {
  id: string
  volume?: number
  number?: string
  year: number
  title?: string
  published_date?: string
}

interface CurrentIssueProps {
  issue: Issue
  journalSlug: string
}

export default function CurrentIssue({ issue, journalSlug }: CurrentIssueProps) {
  return (
    <div className="ojs-card mb-6 bg-gradient-to-r from-[var(--ojs-primary)] to-[var(--ojs-secondary)] text-white">
      <h2 className="text-2xl font-bold mb-4">Issue Terkini</h2>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">
          {issue.title || `Vol. ${issue.volume}, No. ${issue.number} (${issue.year})`}
        </h3>
        {issue.published_date && (
          <p className="text-sm opacity-90">
            Diterbitkan: {new Date(issue.published_date).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={`/${journalSlug}/issue/${issue.id}`}
          className="inline-block bg-white text-[var(--ojs-primary)] px-4 py-2 rounded hover:bg-gray-100 transition-colors"
        >
          Lihat Issue Ini
        </Link>
        <Link
          href={`/${journalSlug}/issues`}
          className="inline-block bg-white/20 text-white px-4 py-2 rounded hover:bg-white/30 transition-colors"
        >
          Lihat Semua Issues
        </Link>
      </div>
    </div>
  )
}

