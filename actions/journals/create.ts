/**
 * Journals Server Actions - Create
 * 
 * Server Actions for creating journals.
 */

'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { auditLog, logJournalAction } from '@/lib/audit/log'
import { sanitizeHTML } from '@/lib/security/sanitize-html'
import { revalidatePath } from 'next/cache'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { journalCreateSchema } from '@/lib/validators/journals'
import { ServerActionAuthOptions } from '@/lib/admin/types'

/**
 * Create a new journal
 */
export async function createJournal(
  values: z.infer<typeof journalCreateSchema>,
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
    const data = journalCreateSchema.parse(values)

    // Get admin client
    const client = createAdminClient()

    // Get default site
    const { data: defaultSite } = await client
      .from('sites')
      .select('id')
      .eq('slug', 'default')
      .single()

    if (!defaultSite) {
      return {
        success: false,
        error: 'Default site not found',
        data: null,
      }
    }

    // Check if path already exists
    if (data.path) {
      const { data: existingJournal } = await client
        .from('journals')
        .select('id')
        .eq('path', data.path)
        .maybeSingle()

      if (existingJournal) {
        return {
          success: false,
          error: 'Journal path already exists',
          data: null,
        }
      }
    }

    // Sanitize HTML fields
    const sanitizedDescription = data.description ? sanitizeHTML(data.description) : null

    // Create tenant for this journal (if not provided)
    // For now, we'll assume tenant_id is provided or create a default tenant
    // In a real implementation, you might want to create a tenant automatically
    const { data: defaultTenant } = await client
      .from('tenants')
      .select('id')
      .eq('slug', 'default')
      .single()

    if (!defaultTenant) {
      return {
        success: false,
        error: 'Default tenant not found',
        data: null,
      }
    }

    // Create journal
    const { data: journal, error } = await client
      .from('journals')
      .insert({
        tenant_id: defaultTenant.id,
        site_id: defaultSite.id,
        title: data.title,
        description: sanitizedDescription,
        abbreviation: data.abbreviation,
        issn: data.issn,
        e_issn: data.e_issn,
        publisher: data.publisher,
        language: data.language || 'id',
        path: data.path,
        status: data.is_active ? 'active' : 'inactive',
        is_active: data.is_active !== false,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[createJournal] Error creating journal:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Assign journal manager if provided
    if (data.journal_manager_id) {
      // Get journal_manager role ID
      const { data: journalManagerRole } = await client
        .from('roles')
        .select('id')
        .eq('role_key', 'journal_manager')
        .single()

      if (journalManagerRole) {
        // Create role assignment
        await client
          .from('user_role_assignments')
          .insert({
            user_id: data.journal_manager_id,
            role_id: journalManagerRole.id,
            journal_id: journal.id,
            tenant_id: defaultTenant.id,
            is_active: true,
          })
          .then(() => {
            // Ignore errors if assignment already exists
          })
          .catch(() => {
            // Ignore errors
          })
      }
    }

    // Log audit event
    await logJournalAction('create_journal', journal.id, {
      title: journal.title,
      path: journal.path,
      tenant_id: journal.tenant_id,
    })

    // Revalidate paths
    revalidatePath('/admin/journals')
    revalidatePath('/admin/dashboard')

    return {
      success: true,
      data: journal,
    }
  } catch (error: any) {
    console.error('[createJournal] Unexpected error:', error)
    
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


