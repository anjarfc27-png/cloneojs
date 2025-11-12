import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security/headers'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase not configured, allow access to public pages
  if (!supabaseUrl || !supabaseAnonKey) {
    // Allow access to public pages
    if (
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/register') ||
      request.nextUrl.pathname.startsWith('/auth') ||
      request.nextUrl.pathname.startsWith('/journal') ||
      request.nextUrl.pathname.startsWith('/article')
    ) {
      return supabaseResponse
    }
    // For protected routes, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const pathname = request.nextUrl.pathname

  try {
    // Get user - try once
    let {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Only log errors, not every request (for performance)
    if (authError) {
      console.error('[MIDDLEWARE] Auth error:', authError.message)
    }

    // If no user and trying to access protected routes, might be cookie sync issue
    // Don't redirect immediately - let the page handle it with retry logic
    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      // Don't redirect here - let the page/layout handle it
      // Apply security headers before returning
      applySecurityHeaders(supabaseResponse, {
        enableCSP: true,
        enableHSTS: process.env.NODE_ENV === 'production',
        enableXSSProtection: true,
      })
      return supabaseResponse
    }

    // Rule 1: If user is logged in and trying to access login/register, check role first
    if (user) {
      // Check if user is super admin (quick check in middleware)
      let isSuperAdmin = false
      try {
        const { data: tenantUsers } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('role', 'super_admin')
          .limit(1)
        
        isSuperAdmin = tenantUsers && tenantUsers.length > 0
      } catch (error) {
        // Ignore error - let layout handle it
        console.log('[MIDDLEWARE] Could not check super admin status, letting layout handle it')
      }

      // If user is logged in and trying to access login/register, redirect based on role
      if (pathname === '/login' || pathname.startsWith('/login/') || 
          pathname === '/register' || pathname.startsWith('/register/')) {
        const url = request.nextUrl.clone()
        url.pathname = isSuperAdmin ? '/admin/dashboard' : '/dashboard'
        const redirectResponse = NextResponse.redirect(url)
        applySecurityHeaders(redirectResponse, {
          enableCSP: true,
          enableHSTS: process.env.NODE_ENV === 'production',
          enableXSSProtection: true,
        })
        return redirectResponse
      }

      // Allow access to dashboard and admin if user is logged in
      // Layout will handle role-based access control
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        applySecurityHeaders(supabaseResponse, {
          enableCSP: true,
          enableHSTS: process.env.NODE_ENV === 'production',
          enableXSSProtection: true,
        })
        return supabaseResponse
      }
    }

    // Rule 2: For other protected routes, redirect to login if no user
    // But we already handled /dashboard and /admin above
  } catch (error: any) {
    console.error('[MIDDLEWARE] Error getting user:', error)
    // Don't redirect on error - let page handle it
    // This allows retry logic in pages to work
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out of
  // sync and terminate the user's session prematurely.

  // Apply security headers without modifying cookies
  // Skip security headers for API routes and static files
  if (
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.startsWith('/static/') &&
    !pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/)
  ) {
    applySecurityHeaders(supabaseResponse, {
      enableCSP: true,
      enableHSTS: process.env.NODE_ENV === 'production',
      enableXSSProtection: true,
    })
  }

  return supabaseResponse
}
