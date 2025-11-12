/**
 * Maintenance Server Actions - Get
 * 
 * Server Actions for retrieving maintenance tasks.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface MaintenanceTask {
  id: string
  name: string
  description: string
  status: 'ready' | 'running' | 'completed' | 'failed'
}

export interface MaintenanceInfo {
  maintenance_tasks: MaintenanceTask[]
  cache_status: {
    last_updated: string | null
    entries: number
  }
}

/**
 * Get maintenance tasks status
 */
export async function getMaintenanceTasks(options: ServerActionAuthOptions = {}) {
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

    // Get system statistics cache status (if table exists)
    let cacheStatus = {
      last_updated: null as string | null,
      entries: 0,
    }

    try {
      const { data: statsCache } = await client
        .from('system_statistics')
        .select('stat_key, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (statsCache && statsCache.length > 0) {
        cacheStatus = {
          last_updated: statsCache[0].updated_at || null,
          entries: statsCache.length,
        }
      }
    } catch (error) {
      // Table doesn't exist - that's okay
      console.log('[getMaintenanceTasks] system_statistics table not found')
    }

    // Define maintenance tasks
    const maintenanceTasks: MaintenanceTask[] = [
      {
        id: 'clear_cache',
        name: 'Clear Cache',
        description: 'Clear system cache and statistics',
        status: 'ready',
      },
      {
        id: 'optimize_database',
        name: 'Optimize Database',
        description: 'Optimize database tables and analyze statistics',
        status: 'ready',
      },
      {
        id: 'cleanup_old_data',
        name: 'Cleanup Old Data',
        description: 'Cleanup old logs and temporary data (older than 90 days)',
        status: 'ready',
      },
      {
        id: 'rebuild_indexes',
        name: 'Rebuild Indexes',
        description: 'Rebuild database indexes for better performance',
        status: 'ready',
      },
    ]

    const maintenanceInfo: MaintenanceInfo = {
      maintenance_tasks: maintenanceTasks,
      cache_status: cacheStatus,
    }

    return {
      success: true,
      data: maintenanceInfo,
    }
  } catch (error: any) {
    console.error('[getMaintenanceTasks] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

