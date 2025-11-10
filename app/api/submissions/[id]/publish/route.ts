import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/submissions/[id]/publish - Publish article (create article from submission)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { issue_id, volume, issue, year, pages, doi } = body

    // Get submission and verify editor access
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select(`
        *,
        journals:journal_id (
          *,
          tenants:tenant_id (
            *,
            tenant_users (*)
          )
        ),
        submission_authors (*),
        submission_files (*)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Only accepted submissions can be published' },
        { status: 400 }
      )
    }

    // Check if user is editor
    const isEditor = submission.journals?.tenants?.tenant_users?.some(
      (tu: any) => tu.user_id === user.id && 
      ['editor', 'section_editor', 'super_admin'].includes(tu.role)
    )

    if (!isEditor) {
      return NextResponse.json(
        { error: 'Only editors can publish articles' },
        { status: 403 }
      )
    }

    // Create article from submission
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert({
        submission_id: params.id,
        journal_id: submission.journal_id,
        section_id: submission.section_id,
        title: submission.title,
        abstract: submission.abstract,
        keywords: submission.keywords,
        doi: doi || null,
        volume: volume || null,
        issue: issue || null,
        year: year || null,
        pages: pages || null,
        issue_id: issue_id || null,
        published_date: new Date().toISOString(),
      })
      .select()
      .single()

    if (articleError) {
      return NextResponse.json({ error: articleError.message }, { status: 500 })
    }

    // Copy authors
    if (submission.submission_authors && submission.submission_authors.length > 0) {
      const articleAuthors = submission.submission_authors.map((author: any, idx: number) => ({
        article_id: article.id,
        first_name: author.first_name,
        last_name: author.last_name,
        email: author.email,
        affiliation: author.affiliation,
        country: author.country,
        orcid_id: author.orcid_id,
        researcher_id: author.researcher_id,
        sequence: idx,
      }))

      await supabase.from('article_authors').insert(articleAuthors)
    }

    // Copy files
    if (submission.submission_files && submission.submission_files.length > 0) {
      const articleFiles = submission.submission_files.map((file: any) => ({
        article_id: article.id,
        file_type: file.file_type,
        file_name: file.file_name,
        file_path: file.file_path,
        file_size: file.file_size,
        mime_type: file.mime_type,
        version: file.version,
      }))

      await supabase.from('article_files').insert(articleFiles)

      // Link Google Drive files
      for (const file of submission.submission_files) {
        const { data: gdFile } = await supabase
          .from('google_drive_files')
          .select('*')
          .eq('submission_file_id', file.id)
          .single()

        if (gdFile) {
          const { data: articleFile } = await supabase
            .from('article_files')
            .select('id')
            .eq('article_id', article.id)
            .eq('file_name', file.file_name)
            .single()

          if (articleFile) {
            await supabase
              .from('google_drive_files')
              .update({ article_file_id: articleFile.id })
              .eq('id', gdFile.id)
          }
        }
      }
    }

    // Update submission status
    await supabase
      .from('submissions')
      .update({ status: 'published' })
      .eq('id', params.id)

    // Create publication history
    await supabase
      .from('publication_history')
      .insert({
        article_id: article.id,
        action: 'published',
        performed_by: user.id,
        new_data: article,
      })

    // Register DOI if provided
    if (doi) {
      await supabase
        .from('doi_registrations')
        .insert({
          article_id: article.id,
          doi,
          status: 'pending',
          registration_agency: 'crossref', // Default
        })
    }

    return NextResponse.json({ article }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

