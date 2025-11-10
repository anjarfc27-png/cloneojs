import Link from 'next/link'

interface Journal {
  id: string
  title: string
  abbreviation?: string
}

interface ArticleHeaderProps {
  journal: Journal
}

export default function ArticleHeader({ journal }: ArticleHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 py-4">
      <div className="ojs-container">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/journal/${journal.id}`}
              className="text-[var(--ojs-primary)] hover:underline font-semibold"
            >
              {journal.title}
            </Link>
            {journal.abbreviation && (
              <span className="text-gray-600 ml-2">({journal.abbreviation})</span>
            )}
          </div>
          <Link
            href={`/journal/${journal.id}`}
            className="text-[var(--ojs-primary)] hover:underline"
          >
            ← Kembali ke Jurnal
          </Link>
        </div>
      </div>
    </header>
  )
}

