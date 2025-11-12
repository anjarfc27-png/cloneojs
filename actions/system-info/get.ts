/**
 * System Info Server Actions - Get
 * 
 * Server Actions for retrieving system information.
 */

'use server'

import { checkSuperAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/db/supabase-admin'

export interface SystemInfoData {
  system: {
    nodeVersion: string
    platform: string
    architecture: string
    nextVersion: string
    environment: string
    supabaseUrl: string
    supabaseKey: string
    timestamp: string
    uptime: number
    memory: {
      used: number
      total: number
      external: number
    }
  }
  server: {
    hostname: string
    port: string
  }
  database: {
    type: string
    url: string
    status: string
    version?: string
  }
  databaseStats?: {
    totalTables: number
    totalUsers: number
    totalJournals: number
    totalArticles: number
    totalIssues: number
  }
}

/**
 * Get system information
 */
export async function getSystemInfo() {
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

    // Get system information (safe - no sensitive data)
    const systemInfo: SystemInfoData = {
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        nextVersion: process.env.npm_package_version || '14.x',
        environment: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 
          'Not configured',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          'Configured (masked)' : 
          'Not configured',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
      },
      server: {
        hostname: process.env.HOSTNAME || process.env.VERCEL_URL || 'unknown',
        port: process.env.PORT || '3000',
      },
      database: {
        type: 'Supabase (PostgreSQL)',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 
          'Not configured',
        status: 'unknown',
      },
    }

    // Test database connection and get stats
    try {
      const client = createAdminClient()

      // Test connection with a simple query
      const { data: testData, error: testError } = await client
        .from('site_settings')
        .select('id')
        .limit(1)

      if (!testError) {
        systemInfo.database.status = 'connected'

        // Get database version
        try {
          const { data: versionData } = await client.rpc('get_postgres_version')
          if (versionData) {
            systemInfo.database.version = versionData as string
          }
        } catch {
          // Ignore version check error
        }

        // Get database stats
        try {
          // Get users count via admin API
          const { data: usersList } = await client.auth.admin.listUsers()
          const usersCount = usersList?.users?.length || 0

          // Get other counts
          const [journalsResult, articlesResult, issuesResult] = await Promise.all([
            client.from('journals').select('id', { count: 'exact', head: true }),
            client.from('articles').select('id', { count: 'exact', head: true }),
            client.from('issues').select('id', { count: 'exact', head: true }),
          ])

          // Get table count using SQL query (approximate list of known tables)
          const knownTables = [
            'sites', 'journals', 'users', 'roles', 'permissions', 'role_permissions',
            'user_role_assignments', 'site_settings', 'announcements', 'navigation_menus',
            'email_templates', 'activity_logs', 'articles', 'issues', 'submissions',
            'sections', 'tenants', 'tenant_users'
          ]
          
          // Count existing tables by trying to query each (simple approach)
          let tableCount = 0
          for (const tableName of knownTables) {
            try {
              const { error: tableError } = await client
                .from(tableName)
                .select('id')
                .limit(1)
              if (!tableError) {
                tableCount++
              }
            } catch {
              // Table doesn't exist or can't access
            }
          }

          systemInfo.databaseStats = {
            totalTables: tableCount,
            totalUsers: usersCount,
            totalJournals: journalsResult.count || 0,
            totalArticles: articlesResult.count || 0,
            totalIssues: issuesResult.count || 0,
          }
        } catch (statsError) {
          console.error('[getSystemInfo] Error fetching database stats:', statsError)
          // Continue without stats
        }
      } else {
        systemInfo.database.status = 'disconnected'
      }
    } catch (dbError) {
      console.error('[getSystemInfo] Error testing database connection:', dbError)
      systemInfo.database.status = 'error'
    }

    return {
      success: true,
      data: systemInfo,
    }
  } catch (error: any) {
    console.error('[getSystemInfo] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get database health check
 */
export async function getDatabaseHealth() {
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

    const client = createAdminClient()

    // Test database connection
    const startTime = Date.now()
    const { error } = await client
      .from('site_settings')
      .select('id')
      .limit(1)
    const responseTime = Date.now() - startTime

    return {
      success: true,
      data: {
        status: error ? 'unhealthy' : 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error: any) {
    console.error('[getDatabaseHealth] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

