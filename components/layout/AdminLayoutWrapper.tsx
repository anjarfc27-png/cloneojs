'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import OJSHeader from './OJSHeader'
import OJSAdminSidebar from '../admin/OJSAdminSidebar'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  user: User | null
}

export default function AdminLayoutWrapper({ children, user: serverUser }: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isChecking, setIsChecking] = useState(!serverUser)
  const [user, setUser] = useState<User | null>(serverUser)
  const router = useRouter()

  useEffect(() => {
    // Client-side verification as fallback if server-side check failed
    async function verifyAccess() {
      // If we already have a user from server, we're good
      if (user) {
        console.log('[ADMIN LAYOUT] ✅ User from server verified:', user.email)
        setIsChecking(false)
        return
      }

      console.log('[ADMIN LAYOUT] No user from server, checking client-side...')
      const supabase = createClient()
      
      // Wait a bit longer for cookie to be available (cookie sync delay)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Try multiple times with increasing delays
      let clientUser = null
      let attempts = 0
      const maxAttempts = 3
      
      while (!clientUser && attempts < maxAttempts) {
        attempts++
        console.log(`[ADMIN LAYOUT] Attempt ${attempts}/${maxAttempts} to get user...`)
        
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error(`[ADMIN LAYOUT] Error getting user (attempt ${attempts}):`, userError.message)
          if (attempts < maxAttempts) {
            // Wait longer before next attempt
            await new Promise(resolve => setTimeout(resolve, 300 * attempts))
            continue
          } else {
            console.log('[ADMIN LAYOUT] Max attempts reached, redirecting to login')
            router.push('/login')
            return
          }
        }
        
        if (userData) {
          clientUser = userData
          console.log('[ADMIN LAYOUT] ✅ User found client-side:', clientUser.email)
          break
        }
        
        // Wait before next attempt
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 300 * attempts))
        }
      }
      
      if (!clientUser) {
        console.log('[ADMIN LAYOUT] No user found after all attempts, redirecting to login')
        router.push('/login')
        return
      }
      
      // Check if user is super admin
      console.log('[ADMIN LAYOUT] Checking super admin role...')
      const { data: tenantUsers, error: roleError } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', clientUser.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .limit(1)

      if (roleError) {
        console.error('[ADMIN LAYOUT] Error checking role:', roleError.message)
        // If role check fails, redirect to dashboard (might not be super admin)
        router.push('/dashboard')
        return
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        console.log('[ADMIN LAYOUT] User is not super admin, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      console.log('[ADMIN LAYOUT] ✅ User is super admin, allowing access')
      // Store the user in state so we can render the layout
      setUser(clientUser)
      setIsChecking(false)
    }

    verifyAccess()
  }, [serverUser, router]) // Use serverUser instead of user to avoid infinite loop

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056A1] mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi akses...</p>
        </div>
      </div>
    )
  }

  // If no user after checking, don't render (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <OJSHeader 
        user={user}
        journalName="Admin Panel"
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />
      <OJSAdminSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

