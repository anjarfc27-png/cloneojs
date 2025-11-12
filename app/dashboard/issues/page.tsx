'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import IssuesClientPage from './page-client'

export default function DashboardIssuesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<{user: any, journal: any} | null>(null)

  useEffect(() => {
    async function checkAuthorization() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.log('[ISSUES PAGE] No user found, redirecting to login')
          router.push('/login')
          return
        }

        // Check if user is super admin
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('role', 'super_admin')
          .single()

        if (tenantUser) {
          // Redirect super admin to admin issues page
          router.push('/admin/issues')
          return
        }

        // Get user's tenant info
        const { data: userJournal } = await supabase
          .from('tenant_users')
          .select('tenant_id, role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (!userJournal) {
          setError('Anda tidak memiliki akses ke jurnal manapun.')
          setLoading(false)
          return
        }

        // Check if user has proper role for managing issues
        const allowedRoles = ['editor', 'section_editor']
        if (!allowedRoles.includes(userJournal.role)) {
          setError('Anda tidak memiliki izin untuk mengelola isu. Role yang diizinkan: editor, section_editor.')
          setLoading(false)
          return
        }

        // Get journal for this tenant
        const { data: journal } = await supabase
          .from('journals')
          .select('id, title')
          .eq('tenant_id', userJournal.tenant_id)
          .eq('is_active', true)
          .limit(1)
          .single()

        if (!journal) {
          setError('Jurnal tidak ditemukan untuk tenant Anda.')
          setLoading(false)
          return
        }

        console.log('[ISSUES PAGE] User authorized, journal:', journal.id)
        setUserData({ user, journal })
        setLoading(false)
        
      } catch (error: any) {
        console.error('[ISSUES PAGE] Error checking authorization:', error)
        setError('Terjadi kesalahan saat memverifikasi akses: ' + error.message)
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0056A1]"></div>
          <span className="ml-3 text-gray-600">Memuat data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  if (!userData) {
    return null // This should not happen, but just in case
  }

  return <IssuesClientPage user={userData.user} journal={userData.journal} />
}

