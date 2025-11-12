/**
 * Issues Server Actions - Get
 * 
 * Server Actions for retrieving issues.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { issueQuerySchema } from '@/lib/validators/issues'

export interface IssueWithRelations {
  id: string
  journal_id: string
  volume: number | null
  number: string | null
  year: number
  title: string | null
  description: string | null
  published_date: string | null
  is_published: boolean
  cover_image_url: string | null
  cover_image_alt_text: string | null
  access_status: string
  created_at: string
  updated_at: string
  itemCount?: number
  status?: 'draft' | 'scheduled' | 'published'
  journal_title?: string
}

/**
 * Get issue status based on is_published and published_date
 */
function getIssueStatus(issue: any): 'draft' | 'scheduled' | 'published' {
  if (issue.is_published) {
    return 'published'
  }
  if (issue.published_date) {
    return 'scheduled'
  }
  return 'draft'
}

/**
 * Get issues with pagination and filtering
 */
export async function getIssues(params: {
  page?: number
  limit?: number
  status?: 'future' | 'back'
  journal_id?: string | null
  search?: string | null
}) {
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

    // Validate and parse params
    const validatedParams = issueQuerySchema.parse({
      page: params.page || 1,
      limit: params.limit || 10,
      status: params.status || 'future',
      journal_id: params.journal_id || null,
      search: params.search || null,
    })

    // Get admin client
    const client = createAdminClient()

    // Build query
    let query = client
      .from('issues')
      .select('*', { count: 'exact' })

    // Filter by journal
    if (validatedParams.journal_id) {
      query = query.eq('journal_id', validatedParams.journal_id)
    }

    // Filter by status
    if (validatedParams.status === 'future') {
      // Future issues: draft or scheduled (not published)
      query = query.eq('is_published', false)
    } else if (validatedParams.status === 'back') {
      // Back issues: published
      query = query.eq('is_published', true)
    }

    // Search filter
    if (validatedParams.search) {
      const searchTerm = validatedParams.search
      // Try to parse as number for year search
      const yearSearch = parseInt(searchTerm)
      if (!isNaN(yearSearch)) {
        query = query.or(`title.ilike.%${searchTerm}%,number.ilike.%${searchTerm}%,year.eq.${yearSearch}`)
      } else {
        query = query.or(`title.ilike.%${searchTerm}%,number.ilike.%${searchTerm}%`)
      }
    }

    // Order by year desc, then volume desc, then number desc
    query = query
      .order('year', { ascending: false })
      .order('volume', { ascending: false, nullsFirst: false })
      .order('number', { ascending: false, nullsFirst: false })

    // Apply pagination
    const offset = (validatedParams.page - 1) * validatedParams.limit
    query = query.range(offset, offset + validatedParams.limit - 1)

    // Execute query
    const { data: issuesData, error, count } = await query

    if (error) {
      console.error('[getIssues] Error fetching issues:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Get item counts for each issue
    const issueIds = (issuesData || []).map((issue: any) => issue.id)
    const itemCounts: Record<string, number> = {}

    if (issueIds.length > 0) {
      const { data: articlesData } = await client
        .from('articles')
        .select('issue_id')
        .in('issue_id', issueIds)

      // Count articles per issue
      articlesData?.forEach((article: any) => {
        if (article.issue_id) {
          itemCounts[article.issue_id] = (itemCounts[article.issue_id] || 0) + 1
        }
      })
    }

    // Get journal titles for issues
    const journalIds = [...new Set((issuesData || []).map((issue: any) => issue.journal_id))]
    const journalsMap = new Map<string, string>()

    if (journalIds.length > 0) {
      const { data: journalsData } = await client
        .from('journals')
        .select('id, title')
        .in('id', journalIds)

      journalsData?.forEach((journal: any) => {
        journalsMap.set(journal.id, journal.title)
      })
    }

    // Transform data to include computed fields
    const issues: IssueWithRelations[] = (issuesData || []).map((issue: any) => {
      const itemCount = itemCounts[issue.id] || 0
      const status = getIssueStatus(issue)
      const journalTitle = journalsMap.get(issue.journal_id) || null

      return {
        id: issue.id,
        journal_id: issue.journal_id,
        volume: issue.volume,
        number: issue.number,
        year: issue.year,
        title: issue.title,
        description: issue.description,
        published_date: issue.published_date,
        is_published: issue.is_published,
        cover_image_url: issue.cover_image_url,
        cover_image_alt_text: issue.cover_image_alt_text,
        access_status: issue.access_status,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        itemCount,
        status,
        journal_title: journalTitle,
      }
    })

    return {
      success: true,
      data: {
        issues,
        total: count || 0,
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalPages: Math.ceil((count || 0) / validatedParams.limit),
      },
    }
  } catch (error: any) {
    console.error('[getIssues] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

