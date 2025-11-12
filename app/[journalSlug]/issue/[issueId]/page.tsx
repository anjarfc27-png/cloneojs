import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JournalHeader from '@/components/journal/JournalHeader'
import JournalSidebar from '@/components/journal/JournalSidebar'
import Image from 'next/image'

interface Article {
  id: string
  title: string
  abstract: string
  doi: string | null
  pages: string | null
  published_date: string | null
  views_count: number
  downloads_count: number
  article_authors: {
    first_name: string
    last_name: string
    affiliation: string | null
    sequence: number
  }[]
  sections: {
    id: string
    title: string
  } | null
}

interface Issue {
  id: string
  volume: number | null
  number: string | null
  year: number
  title: string | null
  description: string | null
  published_date: string | null
  cover_image_url: string | null
  cover_image_alt_text: string | null
}

export default async function IssuePage({
  params,
}: {
  params: { journalSlug: string; issueId: string }
}) {
  const supabase = await createClient()
  
  // Get journal by id or try to find by slug
  let journal: any = null
  
  // Try to get by ID first (UUID format)
  if (params.journalSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    const { data } = await supabase
      .from('journals')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name,
          slug
        )
      `)
      .eq('id', params.journalSlug)
      .eq('is_active', true)
      .single()
    journal = data
  } else {
    // Try to get by tenant slug
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', params.journalSlug)
      .single()
    
    if (tenant) {
      const { data } = await supabase
        .from('journals')
        .select(`
          *,
          tenants:tenant_id (
            id,
            name,
            slug
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .limit(1)
        .single()
      journal = data
    }
  }

  if (!journal) {
    notFound()
  }

  // Get issue details
  const { data: issue } = await supabase
    .from('issues')
    .select('*')
    .eq('id', params.issueId)
    .eq('journal_id', journal.id)
    .eq('is_published', true)
    .single()

  if (!issue) {
    notFound()
  }

  // Get articles in this issue
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      *,
      article_authors (*),
      sections:section_id (
        id,
        title
      )
    `)
    .eq('journal_id', journal.id)
    .eq('issue_id', issue.id)
    .not('published_date', 'is', null)
    .order('sections.title', { ascending: true })
    .order('article_authors.sequence', { ascending: true })

  // Group articles by section
  const articlesBySection = articles?.reduce((acc: Record<string, Article[]>, article) => {
    const sectionTitle = article.sections?.title || 'Artikel Lainnya'
    if (!acc[sectionTitle]) {
      acc[sectionTitle] = []
    }
    acc[sectionTitle].push(article)
    return acc
  }, {}) || {}

  // Get sections
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('is_active', true)
    .order('sequence', { ascending: true })

  // Get navigation info (previous/next issues)
  const { data: allIssues } = await supabase
    .from('issues')
    .select('id, year, volume, number, title')
    .eq('journal_id', journal.id)
    .eq('is_published', true)
    .order('year', { ascending: false })
    .order('volume', { ascending: false })
    .order('number', { ascending: false })

  const currentIndex = allIssues?.findIndex(i => i.id === issue.id) ?? -1
  const previousIssue = currentIndex > 0 ? allIssues[currentIndex - 1] : null
  const nextIssue = currentIndex < (allIssues?.length ?? 0) - 1 ? allIssues[currentIndex + 1] : null

  const issueTitle = issue.title || (
    <>
      Vol. {issue.volume || '-'} 
      {issue.number && ` No. ${issue.number}`} 
      ({issue.year})
    </>
  )

  return (
    <div className="min-h-screen bg-[var(--ojs-bg)]">
      <JournalHeader journal={journal} journalSlug={params.journalSlug} />
      
      <div className="ojs-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Issue Header */}
            <div className="ojs-card mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Cover Image */}
                {issue.cover_image_url && (
                  <div className="flex-shrink-0">
                    <Image
                      src={issue.cover_image_url}
                      alt={issue.cover_image_alt_text || `Cover Issue ${issue.volume || ''}${issue.number ? `(${issue.number})` : ''}`}
                      width={200}
                      height={250}
                      className="rounded shadow-md object-cover"
                    />
                  </div>
                )}
                
                {/* Issue Details */}
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-[var(--ojs-primary)] mb-2">
                    {issueTitle}
                  </h1>
                  
                  {issue.description && (
                    <div className="prose max-w-none mb-4">
                      <p>{issue.description}</p>
                    </div>
                  )}
                  
                  {issue.published_date && (
                    <p className="text-gray-600 mb-2">
                      <strong>Diterbitkan:</strong> {new Date(issue.published_date).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                  
                  <p className="text-gray-600">
                    <strong>Jumlah Artikel:</strong> {articles?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            {(previousIssue || nextIssue) && (
              <div className="ojs-card mb-6">
                <div className="flex justify-between items-center">
                  {previousIssue ? (
                    <Link
                      href={`/${params.journalSlug}/issue/${previousIssue.id}`}
                      className="flex items-center text-[var(--ojs-primary)] hover:text-[var(--ojs-secondary)]"
                    >
                      <span className="mr-2">←</span>
                      <div>
                        <div className="text-sm text-gray-500">Issue Sebelumnya</div>
                        <div className="font-medium">
                          {previousIssue.title || `Vol. ${previousIssue.volume || '-'}${previousIssue.number ? ` No. ${previousIssue.number}` : ''} (${previousIssue.year})`}
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div></div>
                  )}
                  
                  {nextIssue ? (
                    <Link
                      href={`/${params.journalSlug}/issue/${nextIssue.id}`}
                      className="flex items-center text-right text-[var(--ojs-primary)] hover:text-[var(--ojs-secondary)]"
                    >
                      <div>
                        <div className="text-sm text-gray-500">Issue Selanjutnya</div>
                        <div className="font-medium">
                          {nextIssue.title || `Vol. ${nextIssue.volume || '-'}${nextIssue.number ? ` No. ${nextIssue.number}` : ''} (${nextIssue.year})`}
                        </div>
                      </div>
                      <span className="ml-2">→</span>
                    </Link>
                  ) : (
                    <div></div>
                  )}
                </div>
              </div>
            )}

            {/* Articles by Section */}
            {Object.keys(articlesBySection).length === 0 ? (
              <div className="ojs-card">
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Belum ada artikel dalam issue ini.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(articlesBySection).map(([sectionTitle, sectionArticles]) => (
                  <div key={sectionTitle} className="ojs-card">
                    <h2 className="text-xl font-bold text-[var(--ojs-primary)] mb-4 border-b pb-2">
                      {sectionTitle}
                    </h2>
                    <div className="space-y-4">
                      {sectionArticles.map((article) => (
                        <div key={article.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                          <h3 className="font-semibold text-lg mb-2">
                            <Link 
                              href={`/article/${article.id}`}
                              className="text-gray-900 hover:text-[var(--ojs-primary)]"
                            >
                              {article.title}
                            </Link>
                          </h3>
                          
                          {/* Authors */}
                          <div className="text-sm text-gray-600 mb-2">
                            {article.article_authors
                              ?.sort((a, b) => a.sequence - b.sequence)
                              .map((author, index) => (
                                <span key={index}>
                                  {author.first_name} {author.last_name}
                                  {index < article.article_authors.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                          </div>
                          
                          {/* Abstract preview */}
                          {article.abstract && (
                            <p className="text-gray-700 text-sm mb-2 line-clamp-3">
                              {article.abstract.substring(0, 200)}
                              {article.abstract.length > 200 && '...'}
                            </p>
                          )}
                          
                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              {article.doi && (
                                <span>DOI: {article.doi}</span>
                              )}
                              {article.pages && (
                                <span>Hal: {article.pages}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>👁 {article.views_count}</span>
                              <span>📥 {article.downloads_count}</span>
                            </div>
                          </div>
                          
                          {/* Read more */}
                          <div className="mt-2">
                            <Link 
                              href={`/article/${article.id}`}
                              className="text-[var(--ojs-primary)] hover:text-[var(--ojs-secondary)] text-sm font-medium"
                            >
                              Baca Selengkapnya →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <JournalSidebar 
              journal={journal} 
              sections={sections || []}
              journalSlug={params.journalSlug}
            />
          </div>
        </div>
      </div>
    </div>
  )
}