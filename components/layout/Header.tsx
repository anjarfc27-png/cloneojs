'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface HeaderProps {
  user: User
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      console.log('🔵 Logging out...')
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
        alert('Gagal logout: ' + error.message)
        return
      }
      
      console.log('✅ Logout successful, redirecting to login...')
      
      // Use router.push first
      router.push('/login')
      router.refresh()
      
      // Fallback: hard redirect after delay
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          console.log('⚠️ Router.push did not redirect, using window.location as fallback')
          window.location.href = '/login'
        }
      }, 500)
    } catch (error: any) {
      console.error('❌ Logout exception:', error)
      // Force redirect even on error
      window.location.href = '/login'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OJS Multi-Tenant</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">{user.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  )
}

