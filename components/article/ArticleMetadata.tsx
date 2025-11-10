interface Article {
  sections?: {
    title: string
  }
  published_date?: string
}

interface ArticleMetadataProps {
  article: Article
}

export default function ArticleMetadata({ article }: ArticleMetadataProps) {
  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
      {article.sections && (
        <span className="bg-[var(--ojs-primary)] text-white px-3 py-1 rounded-full">
          {article.sections.title}
        </span>
      )}
      {article.published_date && (
        <span>
          Diterbitkan: {new Date(article.published_date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </span>
      )}
    </div>
  )
}

