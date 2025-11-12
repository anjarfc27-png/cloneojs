import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { createCrossrefClient } from '@/lib/crossref/client'
import { articleToCrossrefData } from '@/lib/crossref/utils'
import { logActivity } from '@/lib/admin/dashboard'

/**
 * POST /api/admin/crossref/register
 * Register DOI with Crossref
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase, user } = authCheck
    const body = await request.json()

    const { article_id, doi } = body

    if (!article_id) {
      return NextResponse.json(
        { error: 'article_id is required' },
        { status: 400 }
      )
    }

    // Get article data with relations
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        *,
        article_authors (*),
        journals:journal_id (*)
      `)
      .eq('id', article_id)
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found', details: articleError?.message },
        { status: 404 }
      )
    }

    // Use provided DOI or article DOI
    const articleDOI = doi || article.doi
    if (!articleDOI) {
      return NextResponse.json(
        { error: 'DOI is required. Please provide DOI in request or ensure article has DOI.' },
        { status: 400 }
      )
    }

    // Initialize Crossref client
    const crossrefClient = createCrossrefClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Convert article to Crossref format
    const crossrefData = articleToCrossrefData(article, baseUrl)
    crossrefData.doi = articleDOI

    // Register DOI with Crossref
    const result = await crossrefClient.registerDOI(crossrefData)

    if (result.status === 'error') {
      // Update doi_registrations with error
      await supabase
        .from('doi_registrations')
        .upsert({
          article_id: article.id,
          doi: articleDOI,
          status: 'failed',
          crossref_response: result,
          error_message: result.error || result.message,
          last_attempt: new Date().toISOString(),
          registration_agency: 'crossref',
        }, {
          onConflict: 'article_id,doi',
        })

      return NextResponse.json(
        { error: 'Failed to register DOI', details: result.error || result.message },
        { status: 500 }
      )
    }

    // Update doi_registrations with success
    const { data: doiRegistration, error: doiError } = await supabase
      .from('doi_registrations')
      .upsert({
        article_id: article.id,
        doi: articleDOI,
        status: 'registered',
        crossref_deposit_id: result.deposit_id,
        crossref_response: result,
        registration_date: new Date().toISOString(),
        deposit_date: new Date().toISOString(),
        registration_agency: 'crossref',
        error_message: null,
        last_attempt: new Date().toISOString(),
        retry_count: 0,
      }, {
        onConflict: 'article_id,doi',
      })
      .select()
      .single()

    if (doiError) {
      console.error('Error saving DOI registration:', doiError)
    }

    // Update article with DOI if not already set
    if (!article.doi) {
      await supabase
        .from('articles')
        .update({ doi: articleDOI })
        .eq('id', article.id)
    }

    // Log activity
    await logActivity(
      'doi_registered',
      'article',
      article.id,
      { doi: articleDOI, deposit_id: result.deposit_id }
    )

    return NextResponse.json({
      message: 'DOI registered successfully with Crossref',
      deposit_id: result.deposit_id,
      status: result.status,
      doi: articleDOI,
      registration: doiRegistration,
    })
  } catch (error: any) {
    console.error('Error in Crossref registration:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
