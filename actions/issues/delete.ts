/**
 * Issues Server Actions - Delete
 * 
 * Server Actions for deleting issues.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * Delete issue
 */
export async function deleteIssue(id: string) {
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

    // Get existing issue for audit log
    const { data: existingIssue } = await client
      .from('issues')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingIssue) {
      return {
        success: false,
        error: 'Issue not found',
        data: null,
      }
    }

    // Check if issue has articles
    const { count: articleCount } = await client
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('issue_id', id)

    if (articleCount && articleCount > 0) {
      return {
        success: false,
        error: `Cannot delete issue: It contains ${articleCount} article(s). Please remove articles first.`,
        data: null,
      }
    }

    // Delete issue
    const { error } = await client
      .from('issues')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[deleteIssue] Error deleting issue:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await auditLog({
      action: 'issue_deleted',
      entity_type: 'issue',
      entity_id: id,
      details: {
        journal_id: existingIssue.journal_id,
        volume: existingIssue.volume,
        number: existingIssue.number,
        year: existingIssue.year,
        title: existingIssue.title,
      },
      user_id: authCheck.user?.id,
    })

    // Revalidate paths
    revalidatePath('/admin/issues')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: null,
    }
  } catch (error: any) {
    console.error('[deleteIssue] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

