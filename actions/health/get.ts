/**
 * Health Server Actions - Get
 * 
 * Server Actions for retrieving system health status.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  response_time: number
  error?: string | null
}

export interface HealthData {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  checks: {
    database: HealthCheck
    api: HealthCheck
    storage: HealthCheck
  }
  statistics: {
    cache_entries: number
    recent_logs: number
  }
}

/**
 * Get system health status
 */
export async function getHealthStatus() {
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

    const healthChecks: Record<string, HealthCheck> = {
      database: {
        status: 'unknown',
        response_time: 0,
        error: null,
      },
      api: {
        status: 'healthy',
        response_time: 0,
        error: null,
      },
      storage: {
        status: 'unknown',
        response_time: 0,
        error: null,
      },
    }

    // Check database connection
    const dbStartTime = Date.now()
    try {
      const { error: dbError } = await client
        .from('site_settings')
        .select('id')
        .limit(1)

      healthChecks.database.response_time = Date.now() - dbStartTime
      healthChecks.database.status = dbError ? 'unhealthy' : 'healthy'
      healthChecks.database.error = dbError?.message || null
    } catch (error: any) {
      healthChecks.database.status = 'unhealthy'
      healthChecks.database.error = error.message
      healthChecks.database.response_time = Date.now() - dbStartTime
    }

    // Check API (Server Actions are always available)
    const apiStartTime = Date.now()
    try {
      // Simple API check - just verify we can execute
      healthChecks.api.response_time = Date.now() - apiStartTime
      healthChecks.api.status = 'healthy'
    } catch (error: any) {
      healthChecks.api.status = 'unhealthy'
      healthChecks.api.error = error.message
      healthChecks.api.response_time = Date.now() - apiStartTime
    }

    // Check storage (Supabase Storage)
    const storageStartTime = Date.now()
    try {
      // Test storage access by listing buckets (read-only operation)
      const { data: buckets, error: storageError } = await client.storage.listBuckets()
      
      healthChecks.storage.response_time = Date.now() - storageStartTime
      if (storageError) {
        healthChecks.storage.status = 'unhealthy'
        healthChecks.storage.error = storageError.message
      } else {
        healthChecks.storage.status = 'healthy'
      }
    } catch (error: any) {
      healthChecks.storage.status = 'unhealthy'
      healthChecks.storage.error = error.message
      healthChecks.storage.response_time = Date.now() - storageStartTime
    }

    // Get recent activity logs count (last 24 hours)
    let recentLogsCount = 0
    try {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { count } = await client
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
      
      recentLogsCount = count || 0
    } catch (error) {
      console.error('[getHealthStatus] Error fetching recent logs count:', error)
    }

    // Calculate overall health status
    const hasUnhealthy = Object.values(healthChecks).some(
      check => check.status === 'unhealthy'
    )
    const hasDegraded = Object.values(healthChecks).some(
      check => check.status === 'degraded' || check.status === 'unknown'
    )

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (hasUnhealthy) {
      overallStatus = 'unhealthy'
    } else if (hasDegraded) {
      overallStatus = 'degraded'
    }

    // Get cache entries (approximate - using site_settings as cache-like storage)
    let cacheEntries = 0
    try {
      const { count } = await client
        .from('site_settings')
        .select('*', { count: 'exact', head: true })
      
      cacheEntries = count || 0
    } catch (error) {
      console.error('[getHealthStatus] Error fetching cache entries:', error)
    }

    const healthData: HealthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database: healthChecks.database,
        api: healthChecks.api,
        storage: healthChecks.storage,
      },
      statistics: {
        cache_entries: cacheEntries,
        recent_logs: recentLogsCount,
      },
    }

    return {
      success: true,
      data: healthData,
    }
  } catch (error: any) {
    console.error('[getHealthStatus] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

