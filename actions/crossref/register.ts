/**
 * Crossref Server Actions - Register
 * 
 * Server Actions for registering DOI with Crossref.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { doiRegistrationSchema } from '@/lib/validators/crossref'
import { createCrossrefClient } from '@/lib/crossref/client'
import { articleToCrossrefData } from '@/lib/crossref/utils'
import { revalidatePath } from 'next/cache'

/**
 * Register DOI with Crossref
 */
export async function registerDOI(values: {
  article_id: string
  doi?: string
}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized || !authCheck.user) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const validatedData = doiRegistrationSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get article data with relations
    const { data: article, error: articleError } = await client
      .from('articles')
      .select(`
        *,
        article_authors (*),
        journals:journal_id (*)
      `)
      .eq('id', validatedData.article_id)
      .single()

    if (articleError || !article) {
      return {
        success: false,
        error: 'Article not found',
        data: null,
      }
    }

    // Use provided DOI or article DOI
    const articleDOI = validatedData.doi || (article as any).doi
    if (!articleDOI) {
      return {
        success: false,
        error: 'DOI is required. Please provide DOI in request or ensure article has DOI.',
        data: null,
      }
    }

    // Initialize Crossref client
    const crossrefClient = createCrossrefClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Convert article to Crossref format
    const crossrefData = articleToCrossrefData(article as any, baseUrl)
    crossrefData.doi = articleDOI

    // Register DOI with Crossref
    const result = await crossrefClient.registerDOI(crossrefData)

    // Get existing registration or create new one
    const { data: existingRegistration } = await client
      .from('doi_registrations')
      .select('*')
      .eq('article_id', validatedData.article_id)
      .eq('doi', articleDOI)
      .single()

    const registrationData = {
      article_id: validatedData.article_id,
      doi: articleDOI,
      status: result.status === 'success' ? 'registered' : 'failed',
      crossref_deposit_id: result.deposit_id || null,
      crossref_response: result,
      error_message: result.status === 'error' ? (result.error || result.message) : null,
      last_attempt: new Date().toISOString(),
      registration_agency: 'crossref',
      registration_date: result.status === 'success' ? new Date().toISOString() : null,
      retry_count: existingRegistration?.retry_count ? existingRegistration.retry_count + 1 : 1,
    }

    // Upsert registration
    const { data: registration, error: upsertError } = await client
      .from('doi_registrations')
      .upsert(registrationData, {
        onConflict: 'article_id,doi',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('[registerDOI] Error upserting DOI registration:', upsertError)
      return {
        success: false,
        error: upsertError.message || 'Failed to save DOI registration',
        data: null,
      }
    }

    // Update article with DOI if not already set
    if (!(article as any).doi) {
      const { error: updateError } = await client
        .from('articles')
        .update({ doi: articleDOI })
        .eq('id', validatedData.article_id)

      if (updateError) {
        console.error('[registerDOI] Error updating article DOI:', updateError)
        // Don't fail the whole operation if article update fails
      }
    }

    // Log activity
    await auditLog({
      action: 'doi_registered',
      entity_type: 'doi',
      entity_id: registration?.id || null,
      details: {
        article_id: validatedData.article_id,
        doi: articleDOI,
        status: result.status,
        deposit_id: result.deposit_id,
      },
      user_id: authCheck.user.id,
    })

    revalidatePath('/admin/crossref')

    return {
      success: result.status === 'success',
      data: {
        message: result.status === 'success' 
          ? 'DOI registered successfully with Crossref'
          : `Failed to register DOI: ${result.error || result.message}`,
        deposit_id: result.deposit_id,
        status: result.status,
        doi: articleDOI,
        registration: registration,
        crossref_result: result,
      },
    }
  } catch (error: any) {
    console.error('[registerDOI] Unexpected error:', error)
    if (error.name === 'ZodError') {
      return {
        success: false,
        error: 'Validation error',
        details: error.errors,
        data: null,
      }
    }
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

