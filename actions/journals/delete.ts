/**
 * Journals Server Actions - Delete
 * 
 * Server Actions for deleting journals.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logJournalAction } from '@/lib/audit/log'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { z } from 'zod'

const deleteJournalSchema = z.object({
  id: z.string().uuid('Invalid journal ID'),
})

/**
 * Delete a journal
 */
export async function deleteJournal(values: z.infer<typeof deleteJournalSchema>) {
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
    const data = deleteJournalSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing journal for audit log
    const { data: existingJournal } = await client
      .from('journals')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingJournal) {
      return {
        success: false,
        error: 'Journal not found',
        data: null,
      }
    }

    // Check if journal has submissions or articles
    // For safety, we'll soft delete (set is_active = false) instead of hard delete
    // In a real implementation, you might want to check for dependencies

    // Soft delete: Set status to archived and is_active to false
    const { data: journal, error } = await client
      .from('journals')
      .update({
        status: 'archived',
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[deleteJournal] Error deleting journal:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logJournalAction('delete_journal', journal.id, {
      title: existingJournal.title,
      path: existingJournal.path,
      tenant_id: existingJournal.tenant_id,
    })

    // Revalidate paths
    revalidatePath('/admin/journals')
    revalidatePath('/admin/dashboard')
    if (journal.path) {
      revalidatePath(`/${journal.path}`)
    }

    return {
      success: true,
      data: journal,
    }
  } catch (error: any) {
    console.error('[deleteJournal] Unexpected error:', error)
    
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

/**
 * Hard delete a journal (permanent deletion)
 * WARNING: This will permanently delete the journal and all related data.
 * Use with caution.
 */
export async function hardDeleteJournal(values: z.infer<typeof deleteJournalSchema>) {
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
    const data = deleteJournalSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing journal for audit log
    const { data: existingJournal } = await client
      .from('journals')
      .select('*')
      .eq('id', data.id)
      .single()

    if (!existingJournal) {
      return {
        success: false,
        error: 'Journal not found',
        data: null,
      }
    }

    // Log audit event before deletion
    await logJournalAction('hard_delete_journal', data.id, {
      title: existingJournal.title,
      path: existingJournal.path,
      tenant_id: existingJournal.tenant_id,
    })

    // Hard delete: Actually delete from database
    // Note: This will cascade delete related records if foreign keys are set up correctly
    const { error } = await client
      .from('journals')
      .delete()
      .eq('id', data.id)

    if (error) {
      console.error('[hardDeleteJournal] Error deleting journal:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Revalidate paths
    revalidatePath('/admin/journals')
    revalidatePath('/admin/dashboard')
    if (existingJournal.path) {
      revalidatePath(`/${existingJournal.path}`)
    }

    return {
      success: true,
      data: { id: data.id },
    }
  } catch (error: any) {
    console.error('[hardDeleteJournal] Unexpected error:', error)
    
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


