import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ArticlesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth is handled by DashboardAuthGuard in layout
  // Get published articles
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      journals:journal_id (
        id,
        title
      )
    `)
    .not('published_date', 'is', null)
    .order('published_date', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Published Articles</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {articles && articles.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jurnal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume/Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Publikasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article: any) => (
                <tr key={article.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {article.journals && !Array.isArray(article.journals)
                        ? article.journals.title
                        : Array.isArray(article.journals) && article.journals[0]?.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Vol. {article.volume}, No. {article.issue} ({article.year})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.published_date
                      ? new Date(article.published_date).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.views_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/dashboard/articles/${article.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Belum ada artikel yang dipublikasikan.</p>
          </div>
        )}
      </div>
    </div>
  )
}

