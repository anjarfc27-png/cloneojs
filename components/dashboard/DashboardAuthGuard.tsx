'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper'

export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      console.log('[AUTH GUARD] Starting auth check...')
      
      const supabase = createClient()
      
      // Immediate check
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[AUTH GUARD] Session error:', sessionError.message)
        }
        
        if (session && session.user) {
          console.log('[AUTH GUARD] ✅ Session found! User:', session.user.email)
          
        // Check if user is super admin (handle multiple entries)
        const { data: tenantUsers, error: roleError } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .eq('role', 'super_admin')
          .limit(1)

        if (roleError) {
          console.log('[AUTH GUARD] Error checking role (might not be super admin):', roleError.message)
        }

        // Redirect super admin to admin dashboard (check if any super_admin role exists)
        if (tenantUsers && tenantUsers.length > 0) {
          console.log('[AUTH GUARD] User is super admin, redirecting to /admin/dashboard')
          if (!cancelled) {
            setIsChecking(false)
            window.location.href = '/admin/dashboard'
            return
          }
        }
          
          if (!cancelled) {
            console.log('[AUTH GUARD] User is not super admin, setting user state...')
            // Set state directly - React will batch these updates
            setUser(session.user)
            setIsChecking(false)
            console.log('[AUTH GUARD] State update calls completed')
            return
          }
        }
      } catch (error: any) {
        console.error('[AUTH GUARD] Error getting session:', error.message)
      }
      
      // If first attempt failed, try once more with minimal delay
      if (!cancelled) {
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (cancelled) return
        
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (session && session.user) {
            console.log('[AUTH GUARD] ✅ Session found on retry! User:', session.user.email)
            
            // Check if user is super admin on retry (handle multiple entries)
            const { data: tenantUsers, error: roleError } = await supabase
              .from('tenant_users')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .eq('role', 'super_admin')
              .limit(1)

            if (roleError) {
              console.log('[AUTH GUARD] Error checking role on retry (might not be super admin):', roleError.message)
            }

            // Redirect super admin to admin dashboard on retry (check if any super_admin role exists)
            if (tenantUsers && tenantUsers.length > 0) {
              console.log('[AUTH GUARD] User is super admin on retry, redirecting to /admin/dashboard')
              if (!cancelled) {
                setIsChecking(false)
                window.location.href = '/admin/dashboard'
                return
              }
            }
            
            if (!cancelled) {
              console.log('[AUTH GUARD] Setting user state on retry...')
              setUser(session.user)
              setIsChecking(false)
              console.log('[AUTH GUARD] State updated on retry')
              return
            }
          }
        } catch (error: any) {
          console.error('[AUTH GUARD] Error on retry:', error.message)
        }
      }
      
      // No session found after attempts
      if (!cancelled) {
        console.log('[AUTH GUARD] ❌ No session found, redirecting to login')
        setIsChecking(false)
        router.push('/login')
      }
    }

    checkAuth()

    // Cleanup function
    return () => {
      cancelled = true
    }
  }, [router])

  // Debug logging
  useEffect(() => {
    console.log('[AUTH GUARD] Render state - isChecking:', isChecking, 'user:', user ? user.email : 'null')
  }, [isChecking, user])

  // Show loading while checking
  if (isChecking) {
    console.log('[AUTH GUARD] Rendering loading screen')
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056A1] mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi sesi...</p>
        </div>
      </div>
    )
  }

  // If no user after checking, don't render (will redirect)
  if (!user) {
    console.log('[AUTH GUARD] No user, returning null')
    return null
  }

  // User authenticated - render dashboard
  console.log('[AUTH GUARD] Rendering dashboard for user:', user.email)
  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  )
}
