/**
 * Activity Logs Server Actions - Get
 * 
 * Server Actions for retrieving activity logs.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { activityLogQuerySchema } from '@/lib/validators/activity-logs'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface ActivityLogWithUser {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

/**
 * Get activity logs with pagination and filters
 */
export async function getActivityLogs(params: {
  page?: number
  limit?: number
  action?: string | null
  entity_type?: string | null
  user_id?: string | null
  start_date?: string | null
  end_date?: string | null
  accessToken?: string
}) {
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

    // Validate and parse params
    const validatedParams = activityLogQuerySchema.parse({
      page: params.page || 1,
      limit: params.limit || 50,
      action: params.action || null,
      entity_type: params.entity_type || null,
      user_id: params.user_id || null,
      start_date: params.start_date || null,
      end_date: params.end_date || null,
    })

    // Get admin client
    const client = createAdminClient()

    // Build query
    let query = client
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedParams.action) {
      query = query.eq('action', validatedParams.action)
    }

    if (validatedParams.entity_type) {
      query = query.eq('entity_type', validatedParams.entity_type)
    }

    if (validatedParams.user_id) {
      query = query.eq('user_id', validatedParams.user_id)
    }

    if (validatedParams.start_date) {
      query = query.gte('created_at', validatedParams.start_date)
    }

    if (validatedParams.end_date) {
      query = query.lte('created_at', validatedParams.end_date)
    }

    // Apply pagination
    const offset = (validatedParams.page - 1) * validatedParams.limit
    query = query.range(offset, offset + validatedParams.limit - 1)

    // Execute query
    const { data: logs, error, count } = await query

    if (error) {
      console.error('[getActivityLogs] Error fetching activity logs:', error)
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    // Get user information for logs
    const userIds = [...new Set((logs || []).map((log: any) => log.user_id).filter(Boolean))]
    const usersMap = new Map<string, { email: string; name: string }>()

    if (userIds.length > 0) {
      // Get users from auth (via admin API)
      const { data: usersList } = await client.auth.admin.listUsers()
      if (usersList?.users) {
        usersList.users.forEach((user: any) => {
          if (userIds.includes(user.id)) {
            const userMetadata = user.user_metadata || {}
            const fullName = userMetadata.full_name || 
              `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim() ||
              user.email
            usersMap.set(user.id, {
              email: user.email || '',
              name: fullName,
            })
          }
        })
      }
    }

    // Transform logs with user information
    const logsWithUser: ActivityLogWithUser[] = (logs || []).map((log: any) => {
      const user = log.user_id ? usersMap.get(log.user_id) : null
      return {
        id: log.id,
        user_id: log.user_id,
        user_email: user?.email || null,
        user_name: user?.name || null,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: log.details || {},
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }
    })

    // Get unique actions and entity types for filters (from all logs, not just current page)
    const { data: allActions } = await client
      .from('activity_logs')
      .select('action')
      .limit(1000) // Limit to avoid performance issues

    const { data: allEntityTypes } = await client
      .from('activity_logs')
      .select('entity_type')
      .limit(1000)

    const uniqueActions = [...new Set((allActions || []).map((log: any) => log.action).filter(Boolean))]
    const uniqueEntityTypes = [...new Set((allEntityTypes || []).map((log: any) => log.entity_type).filter(Boolean))]

    return {
      success: true,
      data: {
        logs: logsWithUser,
        total: count || 0,
        page: validatedParams.page,
        limit: validatedParams.limit,
        totalPages: Math.ceil((count || 0) / validatedParams.limit),
        filters: {
          actions: uniqueActions.sort(),
          entity_types: uniqueEntityTypes.sort(),
        },
      },
    }
  } catch (error: any) {
    console.error('[getActivityLogs] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get activity log statistics
 */
export async function getActivityLogStats(options: ServerActionAuthOptions = {}) {
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

    // Get total logs count
    const { count: totalCount } = await client
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })

    // Get logs count by entity type
    const { data: logsByType } = await client
      .from('activity_logs')
      .select('entity_type')

    const entityTypeCounts: Record<string, number> = {}
    logsByType?.forEach((log: any) => {
      const entityType = log.entity_type || 'unknown'
      entityTypeCounts[entityType] = (entityTypeCounts[entityType] || 0) + 1
    })

    // Get logs count by action (top 10)
    const { data: logsByAction } = await client
      .from('activity_logs')
      .select('action')

    const actionCounts: Record<string, number> = {}
    logsByAction?.forEach((log: any) => {
      const action = log.action || 'unknown'
      actionCounts[action] = (actionCounts[action] || 0) + 1
    })

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }))

    return {
      success: true,
      data: {
        total: totalCount || 0,
        by_entity_type: entityTypeCounts,
        top_actions: topActions,
      },
    }
  } catch (error: any) {
    console.error('[getActivityLogStats] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

