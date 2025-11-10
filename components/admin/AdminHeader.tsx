'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut } from 'lucide-react'
import { useState } from 'react'

interface AdminHeaderProps {
  userName?: string
  userEmail?: string
}

export default function AdminHeader({ userName, userEmail }: AdminHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
        alert('Gagal logout: ' + error.message)
        return
      }

      router.push('/login')
      router.refresh()
    } catch (error: any) {
      console.error('Logout exception:', error)
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 h-16 z-50">
      <div className="flex items-center justify-between px-6 h-full">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#0056A1]">OJS Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <div className="p-2 bg-[#0056A1] bg-opacity-10 rounded-full">
              <User className="w-4 h-4 text-[#0056A1]" />
            </div>
            <div>
              <p className="font-medium">{userName || 'Super Admin'}</p>
              {userEmail && <p className="text-xs text-gray-500">{userEmail}</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

