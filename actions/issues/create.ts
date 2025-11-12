/**
 * Issues Server Actions - Create
 * 
 * Server Actions for creating issues.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { issueCreateSchema } from '@/lib/validators/issues'
import { sanitizeHTML } from '@/lib/security/sanitize-html'

/**
 * Create new issue
 */
export async function createIssue(values: z.infer<typeof issueCreateSchema>) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const data = issueCreateSchema.parse(values)

    // Map status to is_published and published_date
    let is_published = false
    let finalPublishedDate: string | null = data.published_date || null

    if (data.status === 'published') {
      is_published = true
      if (!finalPublishedDate) {
        finalPublishedDate = new Date().toISOString()
      }
    } else if (data.status === 'scheduled') {
      is_published = false
      if (!finalPublishedDate) {
        return {
          success: false,
          error: 'published_date is required for scheduled status',
          data: null,
        }
      }
    } else {
      // draft
      is_published = false
      finalPublishedDate = null
    }

    // Get admin client
    const client = createAdminClient()

    // Check for duplicate (journal_id, volume, number, year)
    if (data.volume !== null && data.number) {
      const { data: existingIssue } = await client
        .from('issues')
        .select('id')
        .eq('journal_id', data.journal_id)
        .eq('volume', data.volume)
        .eq('number', data.number)
        .eq('year', data.year)
        .maybeSingle()

      if (existingIssue) {
        return {
          success: false,
          error: 'An issue with this volume, number, and year already exists for this journal',
          data: null,
        }
      }
    }

    // Prepare insert data
    const insertData: any = {
      journal_id: data.journal_id,
      volume: data.volume || null,
      number: data.number || null,
      year: data.year,
      title: data.title ? sanitizeHTML(data.title).replace(/<[^>]*>/g, '') : null,
      description: data.description ? sanitizeHTML(data.description) : null,
      published_date: finalPublishedDate,
      is_published,
      access_status: data.access_status || 'open',
      cover_image_url: data.cover_image_url || null,
      cover_image_alt_text: data.cover_image_alt_text ? sanitizeHTML(data.cover_image_alt_text).replace(/<[^>]*>/g, '') : null,
    }

    // Create issue
    const { data: issue, error } = await client
      .from('issues')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[createIssue] Error creating issue:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await auditLog({
      action: 'issue_created',
      entity_type: 'issue',
      entity_id: issue.id,
      details: {
        journal_id: data.journal_id,
        volume: data.volume,
        number: data.number,
        year: data.year,
        title: data.title,
        status: data.status,
      },
      user_id: authCheck.user?.id,
    })

    // Revalidate paths
    revalidatePath('/admin/issues')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        issue,
      },
    }
  } catch (error: any) {
    console.error('[createIssue] Unexpected error:', error)
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
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

