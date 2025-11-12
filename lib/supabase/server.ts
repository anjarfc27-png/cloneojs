import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  try {
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[createClient] Supabase env vars not set')
      // Return a mock client if env vars not set
      return {
        auth: {
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
              limit: () => ({
                single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
              }),
            }),
            limit: () => ({
              single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
            }),
          }),
        }),
      } as any
    }

    const allCookies = cookieStore.getAll()
    const hasAuthCookies = allCookies.some(c => 
      c.name.includes('supabase') || 
      c.name.includes('auth') ||
      c.name.includes('sb-')
    )

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[createClient] Cookies found:', allCookies.length, 'Has auth cookies:', hasAuthCookies)
    }

    const client = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            const allCookies = cookieStore.getAll()
            // Log for debugging
            if (process.env.NODE_ENV === 'development') {
              const authCookies = allCookies.filter(c => 
                c.name.includes('supabase') || 
                c.name.includes('auth') ||
                c.name.includes('sb-')
              )
              if (authCookies.length > 0) {
                console.log('[createClient] Auth cookies found:', authCookies.map(c => c.name))
              }
            }
            return allCookies
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              if (process.env.NODE_ENV === 'development') {
                console.warn('[createClient] Could not set cookies (this is normal in Server Components):', error)
              }
            }
          },
        },
      }
    )

    // IMPORTANT: For Server Actions, we need to ensure session is refreshed
    // This helps with cookie sync issues between client and server
    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession()
      
      if (sessionError && process.env.NODE_ENV === 'development') {
        console.warn('[createClient] Session error (might be normal):', sessionError.message)
      }
      
      // If no session but we have cookies, try to refresh
      if (!session && hasAuthCookies) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[createClient] No session but cookies exist, attempting refresh...')
        }
        
        // Try to refresh session from cookies
        const { data: refreshData, error: refreshError } = await client.auth.refreshSession()
        
        if (refreshData?.session && process.env.NODE_ENV === 'development') {
          console.log('[createClient] ✅ Session refreshed successfully')
        } else if (refreshError && process.env.NODE_ENV === 'development') {
          console.warn('[createClient] Refresh failed:', refreshError.message)
        }
      }
    } catch (error) {
      // Ignore - this is just a check, don't fail if refresh doesn't work
      if (process.env.NODE_ENV === 'development') {
        console.warn('[createClient] Error during session check:', (error as any)?.message)
      }
    }

    return client
  } catch (error: any) {
    console.error('[createClient] Error creating client:', error.message)
    // Return a safe fallback
    return {
      auth: {
        getUser: async () => ({ 
          data: { user: null }, 
          error: { message: `Failed to create client: ${error.message}` } 
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: 'Client creation failed' } }),
            limit: () => ({
              single: async () => ({ data: null, error: { message: 'Client creation failed' } }),
            }),
          }),
          limit: () => ({
            single: async () => ({ data: null, error: { message: 'Client creation failed' } }),
          }),
        }),
      }),
    } as any
  }
}

