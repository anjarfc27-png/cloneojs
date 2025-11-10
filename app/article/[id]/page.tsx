import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import ArticleHeader from '@/components/article/ArticleHeader'
import ArticlePDFViewer from '@/components/article/ArticlePDFViewer'
import ArticleMetadata from '@/components/article/ArticleMetadata'

export default async function ArticlePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  // Get article
  const { data: article } = await supabase
    .from('articles')
    .select(`
      *,
      journals:journal_id (
        id,
        title,
        abbreviation
      ),
      sections:section_id (
        id,
        title
      ),
      article_authors (*),
      article_files (*,
        google_drive_files (*)
      ),
      issues:issue_id (
        id,
        volume,
        number,
        year
      )
    `)
    .eq('id', params.id)
    .not('published_date', 'is', null)
    .single()

  if (!article) {
    notFound()
  }

  // Get Google Drive file link
  const pdfFile = article.article_files?.find(
    (f: any) => f.mime_type === 'application/pdf' || f.file_type === 'pdf'
  )

  const webViewLink = pdfFile?.google_drive_files?.web_view_link || pdfFile?.file_path

  return (
    <div className="min-h-screen bg-[var(--ojs-bg)]">
      <ArticleHeader journal={article.journals} />

      <div className="ojs-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="ojs-card">
              <ArticleMetadata article={article} />
              
              <h1 className="text-3xl font-bold text-[var(--ojs-primary)] mb-4 mt-6">
                {article.title}
              </h1>

              {/* Authors */}
              {article.article_authors && article.article_authors.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Authors</h2>
                  <div className="space-y-1">
                    {article.article_authors.map((author: any, idx: number) => (
                      <div key={idx} className="text-gray-700">
                        <span className="font-semibold">
                          {author.first_name} {author.last_name}
                        </span>
                        {author.affiliation && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({author.affiliation})
                          </span>
                        )}
                        {author.orcid_id && (
                          <a
                            href={`https://orcid.org/${author.orcid_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--ojs-primary)] hover:underline ml-2 text-sm"
                          >
                            ORCID
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Abstract */}
              {article.abstract && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Abstract</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {article.abstract}
                  </p>
                </div>
              )}

              {/* Keywords */}
              {article.keywords && article.keywords.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {article.keywords.map((keyword: string, idx: number) => (
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

              {/* PDF Viewer */}
              {webViewLink && (
                <div className="mt-8">
                  <ArticlePDFViewer webViewLink={webViewLink} />
                </div>
              )}
            </article>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="ojs-card sticky top-6">
              <h3 className="text-lg font-bold text-[var(--ojs-primary)] mb-4">
                Article Details
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold">Published:</dt>
                  <dd>
                    {article.published_date
                      ? formatDate(article.published_date)
                      : 'N/A'}
                  </dd>
                </div>
                {article.issues && (
                  <div>
                    <dt className="font-semibold">Issue:</dt>
                    <dd>
                      Vol. {article.issues.volume}, No. {article.issues.number} ({article.issues.year})
                    </dd>
                  </div>
                )}
                {article.doi && (
                  <div>
                    <dt className="font-semibold">DOI:</dt>
                    <dd>
                      <a
                        href={`https://doi.org/${article.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--ojs-primary)] hover:underline"
                      >
                        {article.doi}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="font-semibold">Views:</dt>
                  <dd>{article.views_count || 0}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Downloads:</dt>
                  <dd>{article.downloads_count || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

