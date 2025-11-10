import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JournalHeader from '@/components/journal/JournalHeader'
import JournalSidebar from '@/components/journal/JournalSidebar'
import LatestArticles from '@/components/journal/LatestArticles'
import CurrentIssue from '@/components/journal/CurrentIssue'

export default async function JournalPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  // Get journal by ID
  const { data: journal } = await supabase
    .from('journals')
    .select(`
      *,
      tenants:tenant_id (
        id,
        name,
        slug
      )
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!journal) {
    notFound()
  }

  // Get latest published articles
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
    .not('published_date', 'is', null)
    .order('published_date', { ascending: false })
    .limit(10)

  // Get current issue
  const { data: currentIssue } = await supabase
    .from('issues')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('is_published', true)
    .order('published_date', { ascending: false })
    .limit(1)
    .single()

  // Get sections
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('is_active', true)
    .order('sequence', { ascending: true })

  return (
    <div className="min-h-screen bg-[var(--ojs-bg)]">
      <JournalHeader journal={journal} />
      
      <div className="ojs-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Journal Description */}
            <div className="ojs-card mb-6">
              <h2 className="text-2xl font-bold text-[var(--ojs-primary)] mb-4">
                Tentang Jurnal
              </h2>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: journal.description || 'Tidak ada deskripsi.' 
                }}
              />
            </div>

            {/* Current Issue */}
            {currentIssue && (
              <CurrentIssue issue={currentIssue} journalId={journal.id} />
            )}

            {/* Latest Articles */}
            <LatestArticles articles={articles || []} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <JournalSidebar 
              journal={journal} 
              sections={sections || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

