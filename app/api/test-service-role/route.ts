/**
 * Test Service Role Key
 * 
 * This endpoint tests if SUPABASE_SERVICE_ROLE_KEY is working correctly.
 * Access: http://localhost:3000/api/test-service-role
 */

import { createAdminClient } from '@/lib/db/supabase-admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test if admin client can be created
    const client = createAdminClient()
    
    // Test if we can query sites table (bypass RLS)
    const { data, error } = await client
      .from('sites')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        details: error.details,
        hint: 'Service Role Key might be invalid or RLS policies are blocking access'
      }, { status: 500 })
    }
    
    // Test if we can query roles table
    const { data: roles, error: rolesError } = await client
      .from('roles')
      .select('role_key, name')
      .limit(5)
    
    if (rolesError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to query roles table',
        details: rolesError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '✅ Service Role Key is working correctly!',
      tests: {
        sites_table: data ? '✅ Accessible' : '❌ Not accessible',
        roles_table: roles ? '✅ Accessible' : '❌ Not accessible',
      },
      data: {
        sites_count: data?.length || 0,
        roles_count: roles?.length || 0,
        sample_site: data?.[0] || null,
        sample_roles: roles || [],
      }
    })
  } catch (error: any) {
    // Check if error is about missing environment variable
    if (error.message?.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        hint: 'Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local and restart the dev server'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Unknown error',
      hint: 'Check server logs for more details'
    }, { status: 500 })
  }
}



