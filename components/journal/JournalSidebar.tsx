import Link from 'next/link'

interface Section {
  id: string
  title: string
  abbreviation?: string
}

interface Journal {
  id: string
  title: string
  issn?: string
  e_issn?: string
}

interface JournalSidebarProps {
  journal: Journal
  sections: Section[]
}

export default function JournalSidebar({ journal, sections }: JournalSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Sections */}
      <div className="ojs-card">
        <h3 className="text-lg font-bold text-[var(--ojs-primary)] mb-4">
          Sections
        </h3>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={`/journal/${journal.id}/section/${section.id}`}
                className="text-gray-700 hover:text-[var(--ojs-primary)] hover:underline"
              >
                {section.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Journal Info */}
      <div className="ojs-card">
        <h3 className="text-lg font-bold text-[var(--ojs-primary)] mb-4">
          Informasi Jurnal
        </h3>
        <dl className="space-y-2 text-sm">
          {journal.issn && (
            <>
              <dt className="font-semibold">ISSN:</dt>
              <dd>{journal.issn}</dd>
            </>
          )}
          {journal.e_issn && (
            <>
              <dt className="font-semibold">e-ISSN:</dt>
              <dd>{journal.e_issn}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Submit Article */}
      <div className="ojs-card bg-[var(--ojs-primary)] text-white">
        <h3 className="text-lg font-bold mb-2">Submit Article</h3>
        <p className="text-sm mb-4">
          Kirim artikel Anda untuk ditinjau dan dipublikasikan.
        </p>
        <Link
          href="/dashboard/submissions/new"
          className="inline-block bg-white text-[var(--ojs-primary)] px-4 py-2 rounded hover:bg-gray-100 transition-colors"
        >
          Submit Sekarang
        </Link>
      </div>
    </aside>
  )
}

