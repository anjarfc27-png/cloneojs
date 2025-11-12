/**
 * Check session in API route context
 * Access: http://localhost:3000/api/debug/check-session
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    
    console.log('[check-session] All cookies:', allCookies.map(c => c.name))

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    return NextResponse.json({
      success: true,
      hasUser: !!user,
      user: user ? {
        id: user.id,
        email: user.email,
      } : null,
      error: userError?.message,
      cookies: {
        count: allCookies.length,
        names: allCookies.map(c => c.name),
        hasAuthCookies: allCookies.some(c => 
          c.name.includes('supabase') || 
          c.name.includes('auth') ||
          c.name.includes('sb-')
        ),
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}

