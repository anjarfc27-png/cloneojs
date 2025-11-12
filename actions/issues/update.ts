/**
 * Issues Server Actions - Update
 * 
 * Server Actions for updating issues.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { issueUpdateSchema } from '@/lib/validators/issues'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { ServerActionAuthOptions } from '@/lib/admin/types'

/**
 * Update issue
 */
export async function updateIssue(
  values: z.infer<typeof issueUpdateSchema>,
  options: ServerActionAuthOptions = {}
) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Validate input
    const data = issueUpdateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing issue for audit log and validation
    const { data: existingIssue } = await client
      .from('issues')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingIssue) {
      return {
        success: false,
        error: 'Issue not found',
        data: null,
      }
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Update fields if provided
    if (data.journal_id !== undefined) {
      updateData.journal_id = data.journal_id
    }

    if (data.volume !== undefined) {
      updateData.volume = data.volume
    }

    if (data.number !== undefined) {
      updateData.number = data.number
    }

    if (data.year !== undefined) {
      updateData.year = data.year
    }

    if (data.title !== undefined) {
      updateData.title = data.title ? sanitizeHTML(data.title).replace(/<[^>]*>/g, '') : null
    }

    if (data.description !== undefined) {
      updateData.description = data.description ? sanitizeHTML(data.description) : null
    }

    if (data.cover_image_url !== undefined) {
      updateData.cover_image_url = data.cover_image_url
    }

    if (data.cover_image_alt_text !== undefined) {
      updateData.cover_image_alt_text = data.cover_image_alt_text ? sanitizeHTML(data.cover_image_alt_text).replace(/<[^>]*>/g, '') : null
    }

    if (data.access_status !== undefined) {
      updateData.access_status = data.access_status
    }

    // Handle status change
    if (data.status !== undefined) {
      if (data.status === 'published') {
        updateData.is_published = true
        if (data.published_date !== undefined) {
          updateData.published_date = data.published_date || new Date().toISOString()
        } else if (!existingIssue.published_date) {
          updateData.published_date = new Date().toISOString()
        }
      } else if (data.status === 'scheduled') {
        updateData.is_published = false
        if (data.published_date !== undefined) {
          if (!data.published_date) {
            return {
              success: false,
              error: 'published_date is required for scheduled status',
              data: null,
            }
          }
          updateData.published_date = data.published_date
        } else if (!existingIssue.published_date) {
          return {
            success: false,
            error: 'published_date is required for scheduled status',
            data: null,
          }
        }
      } else {
        // draft
        updateData.is_published = false
        if (data.published_date !== undefined) {
          updateData.published_date = data.published_date
        }
      }
    } else if (data.published_date !== undefined) {
      // Only published_date changed, status logic based on current is_published
      updateData.published_date = data.published_date
    }

    // Check for duplicate if volume/number/year changed
    if ((data.volume !== undefined || data.number !== undefined || data.year !== undefined) && 
        (updateData.volume !== null && updateData.number)) {
      const checkVolume = updateData.volume !== undefined ? updateData.volume : existingIssue.volume
      const checkNumber = updateData.number !== undefined ? updateData.number : existingIssue.number
      const checkYear = updateData.year !== undefined ? updateData.year : existingIssue.year
      const checkJournalId = updateData.journal_id || existingIssue.journal_id

      const { data: duplicateIssue } = await client
        .from('issues')
        .select('id')
        .eq('journal_id', checkJournalId)
        .eq('volume', checkVolume)
        .eq('number', checkNumber)
        .eq('year', checkYear)
        .neq('id', data.id)
        .maybeSingle()

      if (duplicateIssue) {
        return {
          success: false,
          error: 'An issue with this volume, number, and year already exists for this journal',
          data: null,
        }
      }
    }

    // Update issue
    const { data: updatedIssue, error } = await client
      .from('issues')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateIssue] Error updating issue:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await auditLog({
      action: 'issue_updated',
      entity_type: 'issue',
      entity_id: data.id,
      details: {
        changes: Object.keys(updateData).filter(key => key !== 'updated_at'),
        status: data.status,
        volume: updateData.volume !== undefined ? updateData.volume : existingIssue.volume,
        number: updateData.number !== undefined ? updateData.number : existingIssue.number,
        year: updateData.year !== undefined ? updateData.year : existingIssue.year,
      },
      user_id: authCheck.user?.id,
    })

    // Revalidate paths
    revalidatePath('/admin/issues')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: {
        issue: updatedIssue,
      },
    }
  } catch (error: any) {
    console.error('[updateIssue] Unexpected error:', error)
    
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

