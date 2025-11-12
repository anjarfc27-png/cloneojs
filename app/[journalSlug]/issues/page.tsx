import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JournalHeader from '@/components/journal/JournalHeader'
import JournalSidebar from '@/components/journal/JournalSidebar'
import Image from 'next/image'

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
  itemCount?: number
}

export default async function IssuesPage({
  params,
}: {
  params: { journalSlug: string }
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

  // Get all published issues, ordered by year desc, volume desc, number desc
  const { data: issues } = await supabase
    .from('issues')
    .select(`
      *,
      articles:articles(count)
    `)
    .eq('journal_id', journal.id)
    .eq('is_published', true)
    .order('year', { ascending: false })
    .order('volume', { ascending: false })
    .order('number', { ascending: false })

  // Get sections
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('journal_id', journal.id)
    .eq('is_active', true)
    .order('sequence', { ascending: true })

  // Group issues by year
  const issuesByYear = issues?.reduce((acc: Record<number, Issue[]>, issue) => {
    if (!acc[issue.year]) {
      acc[issue.year] = []
    }
    acc[issue.year].push({
      ...issue,
      itemCount: issue.articles?.[0]?.count || 0
    })
    return acc
  }, {}) || {}

  return (
    <div className="min-h-screen bg-[var(--ojs-bg)]">
      <JournalHeader journal={journal} journalSlug={params.journalSlug} />
      
      <div className="ojs-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Page Header */}
            <div className="ojs-card mb-6">
              <h1 className="text-3xl font-bold text-[var(--ojs-primary)] mb-2">
                Daftar Issue
              </h1>
              <p className="text-gray-600">
                Semua issue yang telah diterbitkan oleh {journal.title}
              </p>
            </div>

            {/* Issues by Year */}
            {Object.keys(issuesByYear).length === 0 ? (
              <div className="ojs-card">
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Belum ada issue yang diterbitkan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(issuesByYear)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([year, yearIssues]) => (
                    <div key={year} className="ojs-card">
                      <h2 className="text-2xl font-bold text-[var(--ojs-primary)] mb-4 border-b pb-2">
                        Tahun {year}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {yearIssues.map((issue) => (
                          <div key={issue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                              {/* Cover Image */}
                              {issue.cover_image_url && (
                                <div className="flex-shrink-0">
                                  <Image
                                    src={issue.cover_image_url}
                                    alt={issue.cover_image_alt_text || `Cover Issue ${issue.volume || ''}${issue.number ? `(${issue.number})` : ''}`}
                                    width={80}
                                    height={100}
                                    className="rounded object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Issue Details */}
                              <div className="flex-grow">
                                <h3 className="font-semibold text-lg mb-1">
                                  {issue.title || (
                                    <>
                                      Vol. {issue.volume || '-'} 
                                      {issue.number && ` No. ${issue.number}`} 
                                      ({issue.year})
                                    </>
                                  )}
                                </h3>
                                
                                {issue.description && (
                                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                    {issue.description}
                                  </p>
                                )}
                                
                                {issue.published_date && (
                                  <p className="text-sm text-gray-500 mb-2">
                                    Diterbitkan: {new Date(issue.published_date).toLocaleDateString('id-ID', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-500">
                                    {issue.itemCount} artikel
                                  </span>
                                  
                                  <Link
                                    href={`/${params.journalSlug}/issue/${issue.id}`}
                                    className="text-[var(--ojs-primary)] hover:text-[var(--ojs-secondary)] font-medium text-sm"
                                  >
                                    Lihat Issue →
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                }
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