/**
 * Statistics Server Actions - Get
 * 
 * Server Actions for retrieving system statistics.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { statisticsQuerySchema } from '@/lib/validators/statistics'

export interface StatisticsData {
  period: 'all' | 'day' | 'week' | 'month' | 'year'
  startDate: string | null
  endDate: string
  statistics: {
    users: {
      total: number
      editors: number
      reviewers: number
    }
    journals: {
      total: number
      tenants: number
    }
    content: {
      articles: {
        total: number
        period: number
      }
      submissions: {
        total: number
        period: number
        byStatus: Record<string, number>
      }
      issues: {
        total: number
      }
    }
    articlesByJournal: number
  }
}

/**
 * Get system statistics
 */
export async function getStatistics(params: {
  period?: 'all' | 'day' | 'week' | 'month' | 'year'
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
    const validatedParams = statisticsQuerySchema.parse({
      period: params.period || 'all',
    })

    // Get admin client
    const client = createAdminClient()

    // Calculate date range based on period
    let startDate: Date | null = null
    const endDate = new Date()

    switch (validatedParams.period) {
      case 'day':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // Get statistics - using admin client for better performance
    // Get users count (from auth.users via admin API)
    const { data: usersList } = await client.auth.admin.listUsers()
    const totalUsers = usersList?.users?.length || 0

    // Get role-based user counts (from user_role_assignments or tenant_users)
    let editorsCount = 0
    let reviewersCount = 0

    // Try new structure first (user_role_assignments)
    try {
      // Get editor role ID
      const { data: editorRole } = await client
        .from('roles')
        .select('id')
        .eq('role_key', 'editor')
        .maybeSingle()

      // Get reviewer role ID
      const { data: reviewerRole } = await client
        .from('roles')
        .select('id')
        .eq('role_key', 'reviewer')
        .maybeSingle()

      if (editorRole) {
        const { count: editors } = await client
          .from('user_role_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', editorRole.id)
          .eq('is_active', true)
        editorsCount = editors || 0
      }

      if (reviewerRole) {
        const { count: reviewers } = await client
          .from('user_role_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', reviewerRole.id)
          .eq('is_active', true)
        reviewersCount = reviewers || 0
      }
    } catch {
      // Fallback to old structure (tenant_users)
      try {
        const [editorsResult, reviewersResult] = await Promise.all([
          client
            .from('tenant_users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'editor')
            .eq('is_active', true),
          client
            .from('tenant_users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'reviewer')
            .eq('is_active', true),
        ])
        editorsCount = editorsResult.count || 0
        reviewersCount = reviewersResult.count || 0
      } catch {
        // Ignore errors
      }
    }

    // Get other statistics
    const [
      journalsResult,
      articlesResult,
      submissionsResult,
      issuesResult,
      tenantsResult,
    ] = await Promise.all([
      client
        .from('journals')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      client
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .not('published_date', 'is', null),
      client
        .from('submissions')
        .select('*', { count: 'exact', head: true }),
      client
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
      client
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

    // Get period-specific statistics
    let periodSubmissions = 0
    let periodArticles = 0

    if (startDate) {
      const [submissionsCountResult, articlesCountResult] = await Promise.all([
        client
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),
        client
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .not('published_date', 'is', null)
          .gte('published_date', startDate.toISOString()),
      ])

      periodSubmissions = submissionsCountResult.count || 0
      periodArticles = articlesCountResult.count || 0
    }

    // Get submissions by status
    const { data: submissionsByStatus } = await client
      .from('submissions')
      .select('status')
      .limit(10000)

    const statusCounts = (submissionsByStatus || []).reduce(
      (acc: Record<string, number>, sub: any) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1
        return acc
      },
      {}
    )

    // Get articles by journal (count distinct journals)
    const { data: articlesByJournal } = await client
      .from('articles')
      .select('journal_id')
      .not('published_date', 'is', null)
      .limit(10000)

    const journalIds = new Set(
      (articlesByJournal || []).map((art: any) => art.journal_id).filter(Boolean)
    )

    const statisticsData: StatisticsData = {
      period: validatedParams.period,
      startDate: startDate?.toISOString() || null,
      endDate: endDate.toISOString(),
      statistics: {
        users: {
          total: totalUsers,
          editors: editorsCount,
          reviewers: reviewersCount,
        },
        journals: {
          total: journalsResult.count || 0,
          tenants: tenantsResult.count || 0,
        },
        content: {
          articles: {
            total: articlesResult.count || 0,
            period: periodArticles,
          },
          submissions: {
            total: submissionsResult.count || 0,
            period: periodSubmissions,
            byStatus: statusCounts,
          },
          issues: {
            total: issuesResult.count || 0,
          },
        },
        articlesByJournal: journalIds.size,
      },
    }

    return {
      success: true,
      data: statisticsData,
    }
  } catch (error: any) {
    console.error('[getStatistics] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

