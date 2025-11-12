/**
 * Journals Server Actions - Get
 * 
 * Server Actions for retrieving journals.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface GetJournalsParams extends ServerActionAuthOptions {
  page?: number
  limit?: number
  search?: string
}

export interface JournalWithRelations {
  id: string
  tenant_id: string
  site_id?: string | null
  title: string
  description?: string | null
  abbreviation?: string | null
  issn?: string | null
  e_issn?: string | null
  publisher?: string | null
  language: string
  path?: string | null
  status?: string | null
  is_active: boolean
  settings?: Record<string, any>
  created_at: string
  updated_at: string
  tenant_name?: string | null
  editor_id?: string | null
  editor_name?: string | null
}

/**
 * Get all journals with pagination and search
 */
export async function getJournals(params: GetJournalsParams = {}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(params.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    const { page = 1, limit = 10, search = '' } = params

    // Get admin client
    const client = createAdminClient()

    // Build query
    let query = client
      .from('journals')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name
        ),
        sites:site_id (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    // Execute query (search will be done client-side for now)
    // Supabase OR filter syntax is complex, so we'll filter after fetching
    const { data: journals, error } = await query

    if (error) {
      console.error('[getJournals] Error fetching journals:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Get editor information for each journal
    const tenantIds = [...new Set((journals || []).map((j: any) => j.tenant_id).filter(Boolean))]
    
    let editorMap = new Map()
    if (tenantIds.length > 0) {
      // Try new structure first (user_role_assignments)
      const { data: roleAssignments } = await client
        .from('user_role_assignments')
        .select('user_id, tenant_id, roles!inner(role_key)')
        .in('tenant_id', tenantIds)
        .eq('roles.role_key', 'journal_manager')
        .eq('is_active', true)

      if (roleAssignments && roleAssignments.length > 0) {
        roleAssignments.forEach((ra: any) => {
          if (!editorMap.has(ra.tenant_id)) {
            editorMap.set(ra.tenant_id, ra.user_id)
          }
        })
      } else {
        // Fallback to old structure (tenant_users)
        const { data: tenantEditors } = await client
          .from('tenant_users')
          .select('user_id, tenant_id')
          .in('tenant_id', tenantIds)
          .eq('role', 'editor')
          .eq('is_active', true)

        if (tenantEditors) {
          tenantEditors.forEach((te: any) => {
            if (!editorMap.has(te.tenant_id)) {
              editorMap.set(te.tenant_id, te.user_id)
            }
          })
        }
      }
    }

    // Transform data
    let journalsWithRelations: JournalWithRelations[] = (journals || []).map((journal: any) => {
      const editorId = editorMap.get(journal.tenant_id) || null
      return {
        id: journal.id,
        tenant_id: journal.tenant_id,
        site_id: journal.site_id,
        title: journal.title,
        description: journal.description,
        abbreviation: journal.abbreviation,
        issn: journal.issn,
        e_issn: journal.e_issn,
        publisher: journal.publisher,
        language: journal.language,
        path: journal.path,
        status: journal.status || (journal.is_active ? 'active' : 'inactive'),
        is_active: journal.is_active,
        settings: journal.settings || {},
        created_at: journal.created_at,
        updated_at: journal.updated_at,
        tenant_name: journal.tenants?.name || null,
        editor_id: editorId,
        editor_name: null, // Will be populated if we fetch user metadata
      }
    })

    // Apply search filter (client-side)
    if (search) {
      const searchLower = search.toLowerCase()
      journalsWithRelations = journalsWithRelations.filter(
        (j) =>
          j.title?.toLowerCase().includes(searchLower) ||
          j.issn?.toLowerCase().includes(searchLower) ||
          j.e_issn?.toLowerCase().includes(searchLower) ||
          j.description?.toLowerCase().includes(searchLower) ||
          j.abbreviation?.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedJournals = journalsWithRelations.slice(start, end)

    return {
      success: true,
      data: {
        journals: paginatedJournals,
        total: journalsWithRelations.length,
        page,
        limit,
        totalPages: Math.ceil(journalsWithRelations.length / limit),
      },
    }
  } catch (error: any) {
    console.error('[getJournals] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get a single journal by ID
 */
export async function getJournalById(
  journalId: string,
  options: ServerActionAuthOptions = {},
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

    // Get admin client
    const client = createAdminClient()

    // Fetch journal
    const { data: journal, error } = await client
      .from('journals')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name
        ),
        sites:site_id (
          id,
          name,
          slug
        )
      `)
      .eq('id', journalId)
      .single()

    if (error) {
      console.error('[getJournalById] Error fetching journal:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    if (!journal) {
      return {
        success: false,
        error: 'Journal not found',
        data: null,
      }
    }

    // Get editor information
    let editorId = null
    if (journal.tenant_id) {
      // Try new structure first
      const { data: roleAssignment } = await client
        .from('user_role_assignments')
        .select('user_id, roles!inner(role_key)')
        .eq('tenant_id', journal.tenant_id)
        .eq('roles.role_key', 'journal_manager')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (roleAssignment) {
        editorId = roleAssignment.user_id
      } else {
        // Fallback to old structure
        const { data: tenantEditor } = await client
          .from('tenant_users')
          .select('user_id')
          .eq('tenant_id', journal.tenant_id)
          .eq('role', 'editor')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()

        if (tenantEditor) {
          editorId = tenantEditor.user_id
        }
      }
    }

    const journalWithRelations: JournalWithRelations = {
      id: journal.id,
      tenant_id: journal.tenant_id,
      site_id: journal.site_id,
      title: journal.title,
      description: journal.description,
      abbreviation: journal.abbreviation,
      issn: journal.issn,
      e_issn: journal.e_issn,
      publisher: journal.publisher,
      language: journal.language,
      path: journal.path,
      status: journal.status || (journal.is_active ? 'active' : 'inactive'),
      is_active: journal.is_active,
      settings: journal.settings || {},
      created_at: journal.created_at,
      updated_at: journal.updated_at,
      tenant_name: journal.tenants?.name || null,
      editor_id: editorId,
      editor_name: null,
    }

    return {
      success: true,
      data: journalWithRelations,
    }
  } catch (error: any) {
    console.error('[getJournalById] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

