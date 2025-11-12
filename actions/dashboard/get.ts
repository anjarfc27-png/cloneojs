/**
 * Dashboard Server Actions
 * 
 * Server Actions for dashboard statistics and recent activities
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'

export interface DashboardStats {
  totalUsers: number
  totalJournals: number
  activeEditors: number
  submissionsThisMonth: number
  totalArticles: number
  totalIssues: number
  activeTenants: number
}

export interface Activity {
  id: string
  timestamp: Date
  type: string
  description: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  details?: string
  entityType?: string
  entityId?: string
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      throw new Error('Unauthorized')
    }

    const client = createAdminClient()

    // Get total users (count distinct user_id from user_role_assignments)
    const { count: totalUsersCount } = await client
      .from('user_role_assignments')
      .select('*', { count: 'exact', head: true })

    // Also check tenant_users for backward compatibility
    const { count: tenantUsersCount } = await client
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })

    // Use the maximum count (in case of migration)
    const totalUsers = Math.max(totalUsersCount || 0, tenantUsersCount || 0)

    // Get total journals
    const { count: totalJournals } = await client
      .from('journals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get active editors (from user_role_assignments with editor role)
    const { count: activeEditors } = await client
      .from('user_role_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('role_key', 'editor')

    // Get submissions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: submissionsThisMonth } = await client
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    // Get total articles
    const { count: totalArticles } = await client
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('published_date', 'is', null)

    // Get total issues
    const { count: totalIssues } = await client
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get active tenants
    const { count: activeTenants } = await client
      .from('tenants')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    return {
      totalUsers: totalUsers || 0,
      totalJournals: totalJournals || 0,
      activeEditors: activeEditors || 0,
      submissionsThisMonth: submissionsThisMonth || 0,
      totalArticles: totalArticles || 0,
      totalIssues: totalIssues || 0,
      activeTenants: activeTenants || 0,
    }
  } catch (error: any) {
    console.error('[getDashboardStats] Error:', error)
    // Return default values on error
    return {
      totalUsers: 0,
      totalJournals: 0,
      activeEditors: 0,
      submissionsThisMonth: 0,
      totalArticles: 0,
      totalIssues: 0,
      activeTenants: 0,
    }
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return []
    }

    const client = createAdminClient()

    // Get recent activity logs
    const { data: logs, error } = await client
      .from('activity_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        details,
        user_id,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[getRecentActivities] Error:', error)
      return []
    }

    if (!logs || logs.length === 0) {
      return []
    }

    // Get user emails for logs that have user_id
    const userIds = [...new Set(logs.map((log: any) => log.user_id).filter(Boolean))]
    const userMap: Record<string, { email: string; name: string }> = {}

    if (userIds.length > 0) {
      // Try to get user info from user_role_assignments or tenant_users
      // Note: We can't directly query auth.users, so we'll use what we have
      try {
        // Get user info from user_role_assignments if available
        const { data: userRoles } = await client
          .from('user_role_assignments')
          .select('user_id')
          .in('user_id', userIds)
        
        // For now, we'll just use user_id as identifier
        // In production, you might want to store user email/name in a user_profiles table
      } catch (error) {
        console.error('[getRecentActivities] Error fetching user info:', error)
      }
    }

    return logs.map((log: any) => ({
      id: log.id,
      timestamp: new Date(log.created_at),
      type: log.action,
      description: log.action,
      userId: log.user_id,
      userName: log.user_id ? (userMap[log.user_id]?.name || `User ${log.user_id.substring(0, 8)}...`) : 'System',
      userEmail: log.user_id ? userMap[log.user_id]?.email || null : null,
      details: log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : undefined,
      entityType: log.entity_type,
      entityId: log.entity_id,
    }))
  } catch (error: any) {
    console.error('[getRecentActivities] Error:', error)
    return []
  }
}

