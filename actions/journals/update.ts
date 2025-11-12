/**
 * Journals Server Actions - Update
 * 
 * Server Actions for updating journals.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logJournalAction } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { journalUpdateSchema, journalStatusSchema } from '@/lib/validators/journals'

/**
 * Update a journal
 */
export async function updateJournal(values: z.infer<typeof journalUpdateSchema>) {
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
    const data = journalUpdateSchema.parse(values)

    if (!data.id) {
      return {
        success: false,
        error: 'Journal ID is required',
        data: null,
      }
    }

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

    // Check if path already exists (if path is being changed)
    if (data.path && data.path !== existingJournal.path) {
      const { data: pathConflict } = await client
        .from('journals')
        .select('id')
        .eq('path', data.path)
        .neq('id', data.id)
        .maybeSingle()

      if (pathConflict) {
        return {
          success: false,
          error: 'Journal path already exists',
          data: null,
        }
      }
    }

    // Sanitize HTML fields
    const sanitizedDescription = data.description !== undefined
      ? (data.description ? sanitizeHTML(data.description) : null)
      : existingJournal.description

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = sanitizedDescription
    if (data.abbreviation !== undefined) updateData.abbreviation = data.abbreviation
    if (data.issn !== undefined) updateData.issn = data.issn
    if (data.e_issn !== undefined) updateData.e_issn = data.e_issn
    if (data.publisher !== undefined) updateData.publisher = data.publisher
    if (data.language !== undefined) updateData.language = data.language
    if (data.path !== undefined) updateData.path = data.path
    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active
      updateData.status = data.is_active ? 'active' : 'inactive'
    }

    // Update journal
    const { data: journal, error } = await client
      .from('journals')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateJournal] Error updating journal:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Update journal manager if provided
    if (data.journal_manager_id !== undefined) {
      // Get journal_manager role ID
      const { data: journalManagerRole } = await client
        .from('roles')
        .select('id')
        .eq('role_key', 'journal_manager')
        .single()

      if (journalManagerRole) {
        if (data.journal_manager_id) {
          // Assign role
          await client
            .from('user_role_assignments')
            .upsert({
              user_id: data.journal_manager_id,
              role_id: journalManagerRole.id,
              journal_id: journal.id,
              tenant_id: journal.tenant_id,
              is_active: true,
            }, {
              onConflict: 'user_id,role_id,journal_id,tenant_id',
            })
            .then(() => {
              // Ignore errors
            })
            .catch(() => {
              // Ignore errors
            })
        } else {
          // Remove role assignment
          await client
            .from('user_role_assignments')
            .delete()
            .eq('journal_id', journal.id)
            .eq('role_id', journalManagerRole.id)
            .then(() => {
              // Ignore errors
            })
            .catch(() => {
              // Ignore errors
            })
        }
      }
    }

    // Log audit event
    await logJournalAction('update_journal', journal.id, {
      before: {
        title: existingJournal.title,
        path: existingJournal.path,
        is_active: existingJournal.is_active,
      },
      after: {
        title: journal.title,
        path: journal.path,
        is_active: journal.is_active,
      },
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
    console.error('[updateJournal] Unexpected error:', error)
    
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
 * Update journal status
 */
export async function updateJournalStatus(values: z.infer<typeof journalStatusSchema>) {
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
    const data = journalStatusSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get existing journal
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

    // Update status
    const isActive = data.status === 'active'
    const { data: journal, error } = await client
      .from('journals')
      .update({
        status: data.status,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('[updateJournalStatus] Error updating journal status:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Log audit event
    await logJournalAction('update_journal_status', journal.id, {
      before: {
        status: existingJournal.status || (existingJournal.is_active ? 'active' : 'inactive'),
        is_active: existingJournal.is_active,
      },
      after: {
        status: data.status,
        is_active: isActive,
      },
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
    console.error('[updateJournalStatus] Unexpected error:', error)
    
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


