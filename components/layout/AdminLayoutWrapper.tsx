'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import OJSHeader from './OJSHeader'
import OJSAdminSidebar from '../admin/OJSAdminSidebar'
import { AdminAuthProvider, useAdminAuth } from '../admin/AdminAuthProvider'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  user: User | null
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, setUser } = useAdminAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    if (user) {
      document.cookie = `sb-super-admin-user=${user.id}; path=/; SameSite=Lax`
    } else {
      document.cookie = 'sb-super-admin-user=; Max-Age=0; path=/; SameSite=Lax'
    }
    setIsChecking(!user)
  }, [user])

  useEffect(() => {
    async function verifyAccess() {
      if (user) {
        return
      }

      if (!supabaseRef.current) {
        supabaseRef.current = createClient()
      }
      const supabase = supabaseRef.current

      console.log('[ADMIN LAYOUT] No user from server, checking client-side...')

      await new Promise((resolve) => setTimeout(resolve, 200))

      let clientUser: User | null = null
      let attempts = 0
      const maxAttempts = 3

      while (!clientUser && attempts < maxAttempts) {
        attempts++
        console.log(`[ADMIN LAYOUT] Attempt ${attempts}/${maxAttempts} to get user...`)

        const {
          data: { user: userData },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error(`[ADMIN LAYOUT] Error getting user (attempt ${attempts}):`, userError.message)
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 200 * attempts))
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

        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 200 * attempts))
        }
      }

      if (!clientUser) {
        console.log('[ADMIN LAYOUT] No user found after all attempts, redirecting to login')
        router.push('/login')
        return
      }

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
        router.push('/dashboard')
        return
      }

      if (!tenantUsers || tenantUsers.length === 0) {
        console.log('[ADMIN LAYOUT] User is not super admin, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      console.log('[ADMIN LAYOUT] ✅ User is super admin, allowing access')
      setUser(clientUser)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('admin-auth-complete', {
            detail: { user: clientUser },
          })
        )
      }
    }

    if (!user) {
      verifyAccess()
    }
  }, [user, router, setUser])

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
      <OJSAdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function AdminLayoutWrapper({ children, user: serverUser }: AdminLayoutWrapperProps) {
  return (
    <AdminAuthProvider initialUser={serverUser}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuthProvider>
  )
}
