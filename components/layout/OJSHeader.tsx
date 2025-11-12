'use client'

import { useState } from 'react'
import { Bell, UserCircle, LogOut, Menu, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface OJSHeaderProps {
  user: User
  journalName?: string
  onMenuToggle?: () => void
  isMenuOpen?: boolean
}

export default function OJSHeader({ user, journalName = 'Jurnal', onMenuToggle, isMenuOpen }: OJSHeaderProps) {
  const router = useRouter()
  const [notificationCount] = useState(1) // TODO: Get from Supabase
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    try {
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
    }
  }

  return (
    <header className="bg-[#003049] text-white sticky top-0 z-50 shadow-md">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Logo/Title and Menu Toggle */}
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="lg:hidden text-white hover:bg-[#002837] p-2 rounded transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          <h1 className="text-lg font-semibold">OJS3 Jurnal</h1>
        </div>

        {/* Right: Notifications and User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-[#002837] rounded transition-colors"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-[#002837] rounded transition-colors"
              aria-label="User menu"
            >
              <UserCircle className="w-6 h-6" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    {user.user_metadata?.full_name && (
                      <p className="text-xs text-gray-500">{user.user_metadata.full_name}</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
