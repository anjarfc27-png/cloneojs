import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  try {
    const pathname = request.nextUrl.pathname
    
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
      return supabaseResponse
    }

    // Rule 1: If user is logged in and trying to access login/register, redirect to dashboard
    if (user) {
      if (pathname === '/login' || pathname.startsWith('/login/') || 
          pathname === '/register' || pathname.startsWith('/register/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      // Allow access to dashboard and admin if user is logged in
      // Layout will handle role-based access control
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
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

  return supabaseResponse
}
