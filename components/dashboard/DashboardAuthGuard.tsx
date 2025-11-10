'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import DashboardLayoutWrapper from '@/components/layout/DashboardLayoutWrapper'

export default function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const hasCheckedRef = useRef(false) // Prevent multiple checks in React Strict Mode

  useEffect(() => {
    // Prevent multiple runs (React Strict Mode in dev causes double render)
    if (hasCheckedRef.current) {
      return
    }
    hasCheckedRef.current = true

    let isMounted = true

    async function checkAuth() {
      console.log('[AUTH GUARD] Starting auth check...')
      
      const supabase = createClient()
      
      // Immediate check - no delay
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[AUTH GUARD] Session error:', sessionError.message)
        }
        
        if (session && session.user) {
          console.log('[AUTH GUARD] ✅ Session found! User:', session.user.email)
          
          if (isMounted) {
            setUser(session.user)
            setIsChecking(false)
            return // Success - exit immediately
          }
        }
      } catch (error: any) {
        console.error('[AUTH GUARD] Error getting session:', error.message)
      }
      
      // If first attempt failed, try once more with minimal delay (only for cookie sync after login)
      if (isMounted) {
        await new Promise(resolve => setTimeout(resolve, 100)) // Reduced from 200ms to 100ms
        
        if (!isMounted) return
        
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (session && session.user) {
            console.log('[AUTH GUARD] ✅ Session found on retry! User:', session.user.email)
            
            if (isMounted) {
              setUser(session.user)
              setIsChecking(false)
              return
            }
          }
        } catch (error: any) {
          console.error('[AUTH GUARD] Error on retry:', error.message)
        }
      }
      
      // No session found after attempts
      if (isMounted) {
        console.log('[AUTH GUARD] ❌ No session found, redirecting to login')
        setIsChecking(false)
        router.push('/login')
      }
    }

    checkAuth()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [router])

  // Show loading while checking
  if (isChecking) {
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
    return null
  }

  // User authenticated - render dashboard
  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  )
}
