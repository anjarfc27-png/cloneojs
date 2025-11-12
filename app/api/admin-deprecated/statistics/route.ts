import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * GET /api/admin/statistics
 * Get system statistics
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 'all', 'day', 'week', 'month', 'year'

    // Calculate date range based on period
    let startDate: Date | null = null
    const endDate = new Date()

    switch (period) {
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

    // Get statistics
    const [
      { data: tenantUsersData },
      { count: totalJournals },
      { count: totalArticles },
      { count: totalSubmissions },
      { count: totalIssues },
      { count: totalTenants },
      { count: activeEditors },
      { count: activeReviewers },
    ] = await Promise.all([
      supabase.from('tenant_users').select('user_id').limit(10000),
      supabase.from('journals').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('articles').select('*', { count: 'exact', head: true }).not('published_date', 'is', null),
      supabase.from('submissions').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('tenant_users').select('*', { count: 'exact', head: true }).eq('role', 'editor').eq('is_active', true),
      supabase.from('tenant_users').select('*', { count: 'exact', head: true }).eq('role', 'reviewer').eq('is_active', true),
    ])

    // Count distinct users
    const uniqueUserIds = new Set(tenantUsersData?.map((tu: any) => tu.user_id) || [])
    const totalUsers = uniqueUserIds.size

    // Get period-specific statistics
    let periodSubmissions = 0
    let periodArticles = 0

    if (startDate) {
      const [
        { count: submissionsCount },
        { count: articlesCount },
      ] = await Promise.all([
        supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('articles')
          .select('*', { count: 'exact', head: true })
          .not('published_date', 'is', null)
          .gte('published_date', startDate.toISOString()),
      ])

      periodSubmissions = submissionsCount || 0
      periodArticles = articlesCount || 0
    }

    // Get submissions by status
    const { data: submissionsByStatus } = await supabase
      .from('submissions')
      .select('status')
      .limit(10000)

    const statusCounts = (submissionsByStatus || []).reduce((acc: Record<string, number>, sub: any) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1
      return acc
    }, {})

    // Get articles by journal
    const { data: articlesByJournal } = await supabase
      .from('articles')
      .select('journal_id')
      .not('published_date', 'is', null)
      .limit(10000)

    const journalCounts = (articlesByJournal || []).reduce((acc: Record<string, number>, art: any) => {
      acc[art.journal_id] = (acc[art.journal_id] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      period,
      startDate: startDate?.toISOString() || null,
      endDate: endDate.toISOString(),
      statistics: {
        users: {
          total: totalUsers,
          editors: activeEditors || 0,
          reviewers: activeReviewers || 0,
        },
        journals: {
          total: totalJournals || 0,
          tenants: totalTenants || 0,
        },
        content: {
          articles: {
            total: totalArticles || 0,
            period: periodArticles,
          },
          submissions: {
            total: totalSubmissions || 0,
            period: periodSubmissions,
            byStatus: statusCounts,
          },
          issues: {
            total: totalIssues || 0,
          },
        },
        articlesByJournal: Object.keys(journalCounts).length,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

