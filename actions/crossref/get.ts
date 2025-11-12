/**
 * Crossref Server Actions - Get
 * 
 * Server Actions for retrieving Crossref/DOI information.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { doiStatusQuerySchema } from '@/lib/validators/crossref'

export interface DOIRegistration {
  id: string
  article_id: string
  doi: string
  status: 'pending' | 'registered' | 'failed'
  crossref_deposit_id?: string | null
  crossref_response?: any
  registration_date?: string | null
  registration_agency?: string | null
  last_attempt?: string | null
  retry_count: number
  error_message?: string | null
  created_at: string
  updated_at: string
  articles?: {
    id: string
    title: string
    journals?: {
      id: string
      title: string
    }
  }
}

export interface DOIRegistrationsResponse {
  registrations: DOIRegistration[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * Get all DOI registrations
 */
export async function getDOIRegistrations(params: {
  status?: 'all' | 'registered' | 'pending' | 'failed'
  page?: number
  limit?: number
} = {}) {
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
    const validatedParams = doiStatusQuerySchema.parse({
      status: params.status || 'all',
      page: params.page || 1,
      limit: params.limit || 20,
    })

    // Get admin client
    const client = createAdminClient()

    // Build query
    let query = client
      .from('doi_registrations')
      .select(
        `
        *,
        articles:article_id (
          id,
          title,
          journals:journal_id (
            id,
            title
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // Filter by status
    if (validatedParams.status && validatedParams.status !== 'all') {
      query = query.eq('status', validatedParams.status)
    }

    // Pagination
    const from = (validatedParams.page - 1) * validatedParams.limit
    const to = from + validatedParams.limit - 1
    query = query.range(from, to)

    const { data: registrations, error, count } = await query

    if (error) {
      console.error('[getDOIRegistrations] Error fetching DOI registrations:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch DOI registrations',
        data: null,
      }
    }

    const response: DOIRegistrationsResponse = {
      registrations: (registrations || []) as DOIRegistration[],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / validatedParams.limit),
      },
    }

    return {
      success: true,
      data: response,
    }
  } catch (error: any) {
    console.error('[getDOIRegistrations] Unexpected error:', error)
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

/**
 * Get DOI status from Crossref
 */
export async function getDOIStatus(doi: string) {
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

    // Get admin client
    const client = createAdminClient()

    // Get registration from database
    const { data: registration, error } = await client
      .from('doi_registrations')
      .select('*')
      .eq('doi', doi)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      console.error('[getDOIStatus] Error fetching DOI registration:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch DOI status',
        data: null,
      }
    }

    // Check if DOI exists in Crossref (using Crossref API)
    // For now, we'll return the database status
    // In production, you might want to call Crossref API to verify

    return {
      success: true,
      data: {
        doi,
        status: registration?.status || 'unknown',
        registered: registration?.status === 'registered',
        registration: registration || null,
      },
    }
  } catch (error: any) {
    console.error('[getDOIStatus] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

