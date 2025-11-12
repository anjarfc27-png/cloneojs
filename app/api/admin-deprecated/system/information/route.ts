import { NextRequest, NextResponse } from 'next/server'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * GET /api/admin/system/information
 * Get system information
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }

    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      nextVersion: process.env.npm_package_version || '14.x',
      environment: process.env.NODE_ENV || 'development',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Not configured',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    }

    return NextResponse.json({
      system: systemInfo,
      server: {
        hostname: process.env.HOSTNAME || 'unknown',
        port: process.env.PORT || '3000',
      },
      database: {
        type: 'Supabase (PostgreSQL)',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/system/information:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

