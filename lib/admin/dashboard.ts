/**
 * Utility functions for Admin Dashboard
 * Integrated with Supabase
 */

import { createClient } from '@/lib/supabase/server'

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
  details?: string
  entityType?: string
  entityId?: string
}

/**
 * Get dashboard statistics from Supabase
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  
  try {
    // Get total users (count distinct user_id from tenant_users)
    // Note: We use tenant_users because we can't directly query auth.users
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('user_id')
      .limit(10000) // Get all records to count distinct
    
    const uniqueUserIds = new Set(tenantUsers?.map((tu: any) => tu.user_id) || [])
    const totalUsers = uniqueUserIds.size

    // Get total journals
    const { count: totalJournals } = await supabase
      .from('journals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get active editors
    const { count: activeEditors } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'editor')
      .eq('is_active', true)

    // Get submissions this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { count: submissionsThisMonth } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())

    // Get total articles
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .not('published_date', 'is', null)

    // Get total issues
    const { count: totalIssues } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get active tenants
    const { count: activeTenants } = await supabase
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
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
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
 * Get recent activities from activity_logs table
 */
export async function getRecentActivities(limit: number = 10): Promise<Activity[]> {
  const supabase = await createClient()
  
  try {
    const { data: logs, error } = await supabase
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
      console.error('Error fetching activities:', error)
      return []
    }

    // Get user emails for logs that have user_id
    const userIds = [...new Set((logs || []).map((log: any) => log.user_id).filter(Boolean))]
    const userEmails: Record<string, string> = {}
    
    if (userIds.length > 0) {
      // Get user emails from tenant_users (we can't directly query auth.users)
      const { data: tenantUsers } = await supabase
        .from('tenant_users')
        .select('user_id')
        .in('user_id', userIds)
        .limit(1000)
      
      // Note: We can't get email directly, so we'll use user_id as identifier
      // In production, you might want to store email in a user_profiles table
    }

    return (logs || []).map((log: any) => ({
      id: log.id,
      timestamp: new Date(log.created_at),
      type: log.action,
      description: log.action,
      userId: log.user_id,
      userName: log.user_id ? `User ${log.user_id.substring(0, 8)}...` : 'System',
      details: log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : undefined,
      entityType: log.entity_type,
      entityId: log.entity_id,
    }))
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

/**
 * Log activity to database
 */
export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>,
  userId?: string
): Promise<void> {
  const supabase = await createClient()
  
  try {
    // Get current user if not provided
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      currentUserId = user?.id
    }

    await supabase
      .from('activity_logs')
      .insert({
        user_id: currentUserId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details: details || {},
      })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw - activity logging should not break the main flow
  }
}

