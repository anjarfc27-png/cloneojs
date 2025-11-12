/**
 * Test checkSuperAdmin function directly
 * Access: http://localhost:3000/api/debug/test-check-super-admin
 */

import { checkSuperAdmin } from '@/lib/admin/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[test-check-super-admin] Starting check...')
    
    const authCheck = await checkSuperAdmin()
    
    console.log('[test-check-super-admin] Result:', {
      authorized: authCheck.authorized,
      hasUser: !!authCheck.user,
      hasError: !!authCheck.error,
    })

    return NextResponse.json({
      success: true,
      result: {
        authorized: authCheck.authorized,
        hasUser: !!authCheck.user,
        user: authCheck.user ? {
          id: authCheck.user.id,
          email: authCheck.user.email,
        } : null,
        error: authCheck.error ? 'Has error response' : null,
        supabase: authCheck.supabase ? 'Available' : null,
      },
      diagnosis: {
        isAuthorized: authCheck.authorized,
        shouldWork: authCheck.authorized === true,
        issue: authCheck.authorized ? null : 'User is not authorized as super admin',
      },
    })
  } catch (error: any) {
    console.error('[test-check-super-admin] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

