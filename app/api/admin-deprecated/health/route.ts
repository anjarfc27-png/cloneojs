import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'

/**
 * GET /api/admin/health
 * Get system health status
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    const healthChecks: Record<string, any> = {
      database: {
        status: 'unknown',
        response_time: 0,
        error: null,
      },
      api: {
        status: 'healthy',
        response_time: 0,
      },
      storage: {
        status: 'unknown',
        error: null,
      },
    }

    // Check database connection
    const dbStartTime = Date.now()
    try {
      const { error: dbError } = await supabase
        .from('tenants')
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

    // Get system statistics
    const { data: stats, error: statsError } = await supabase
      .from('system_statistics')
      .select('stat_key, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5)

    // Get recent activity logs count
    const { count: recentLogsCount } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // Overall health status
    const overallStatus = 
      healthChecks.database.status === 'healthy' && 
      healthChecks.api.status === 'healthy'
        ? 'healthy'
        : 'degraded'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      statistics: {
        cache_entries: stats?.length || 0,
        recent_logs: recentLogsCount || 0,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/health:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Internal server error', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}


