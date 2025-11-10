'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import OJSHeader from './OJSHeader'
import OJSAdminSidebar from '../admin/OJSAdminSidebar'

interface AdminLayoutWrapperProps {
  children: React.ReactNode
  user: User | null
}

export default function AdminLayoutWrapper({ children, user }: AdminLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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

