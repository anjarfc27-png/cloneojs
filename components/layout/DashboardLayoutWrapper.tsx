'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import OJSHeader from './OJSHeader'
import OJSSidebar from './OJSSidebar'

interface DashboardLayoutWrapperProps {
  children: React.ReactNode
  user: User
}

export default function DashboardLayoutWrapper({ children, user }: DashboardLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <OJSHeader 
        user={user} 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />
      <OJSSidebar 
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
