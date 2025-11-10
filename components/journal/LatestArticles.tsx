import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Article {
  id: string
  title: string
  abstract?: string
  published_date?: string
  article_authors?: Array<{
    first_name: string
    last_name: string
  }>
  sections?: {
    title: string
  }
}

interface LatestArticlesProps {
  articles: Article[]
}

export default function LatestArticles({ articles }: LatestArticlesProps) {
  if (articles.length === 0) {
    return (
      <div className="ojs-card">
        <h2 className="text-2xl font-bold text-[var(--ojs-primary)] mb-4">
          Artikel Terbaru
        </h2>
        <p className="text-gray-600">Belum ada artikel yang dipublikasikan.</p>
      </div>
    )
  }

  return (
    <div className="ojs-card">
      <h2 className="text-2xl font-bold text-[var(--ojs-primary)] mb-6">
        Artikel Terbaru
      </h2>
      <div className="space-y-6">
        {articles.map((article) => (
          <article key={article.id} className="border-b border-gray-200 pb-6 last:border-0">
            <h3 className="text-xl font-semibold mb-2">
              <Link
                href={`/article/${article.id}`}
                className="text-[var(--ojs-primary)] hover:underline"
              >
                {article.title}
              </Link>
            </h3>
            
            <div className="text-sm text-gray-600 mb-2">
              {article.article_authors && article.article_authors.length > 0 && (
                <span>
                  {article.article_authors.map((author, idx) => (
                    <span key={idx}>
                      {author.first_name} {author.last_name}
                      {idx < article.article_authors!.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              )}
              {article.published_date && (
                <span className="mx-2">•</span>
              )}
              {article.published_date && (
                <span>{formatDate(article.published_date)}</span>
              )}
            </div>

            {article.abstract && (
              <p className="text-gray-700 mb-3 line-clamp-3">
                {article.abstract}
              </p>
            )}

            <Link
              href={`/article/${article.id}`}
              className="text-[var(--ojs-primary)] hover:underline text-sm font-semibold"
            >
              Baca Selengkapnya →
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

