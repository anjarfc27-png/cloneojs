/**
 * Issues Server Actions - Publish
 * 
 * Server Actions for publishing issues.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * Publish issue (set is_published = true and published_date = now if not set)
 */
export async function publishIssue(id: string) {
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

    // Validate ID
    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'Invalid issue ID',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get current issue
    const { data: currentIssue, error: fetchError } = await client
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentIssue) {
      return {
        success: false,
        error: 'Issue not found',
        data: null,
      }
    }

    // Check if already published
    if (currentIssue.is_published) {
      return {
        success: false,
        error: 'Issue is already published',
        data: null,
      }
    }

    // Prepare update data
    const updateData: any = {
      is_published: true,
      updated_at: new Date().toISOString(),
    }

    // Set published_date if not already set
    if (!currentIssue.published_date) {
      updateData.published_date = new Date().toISOString()
    }

    // Update issue
    const { data: updatedIssue, error } = await client
      .from('issues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[publishIssue] Error publishing issue:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await auditLog({
      action: 'issue_published',
      entity_type: 'issue',
      entity_id: id,
      details: {
        journal_id: currentIssue.journal_id,
        volume: currentIssue.volume,
        number: currentIssue.number,
        year: currentIssue.year,
        title: currentIssue.title,
        published_date: updateData.published_date || currentIssue.published_date,
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
    console.error('[publishIssue] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

