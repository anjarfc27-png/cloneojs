import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IssuesClientPage from './page-client'

export default async function DashboardIssuesPage() {
  const supabase = await createClient()
  
  // Get user from server-side session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('[ISSUES PAGE] No user found, redirecting to login')
    redirect('/login')
  }

  try {
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
      redirect('/admin/issues')
    }

    // Get user's tenant info
    const { data: userJournal } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!userJournal) {
      console.log('[ISSUES PAGE] User has no journal access')
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            Anda tidak memiliki akses ke jurnal manapun.
          </div>
        </div>
      )
    }

    // Check if user has proper role for managing issues
    const allowedRoles = ['editor', 'section_editor']
    if (!allowedRoles.includes(userJournal.role)) {
      console.log('[ISSUES PAGE] User role not allowed:', userJournal.role)
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            Anda tidak memiliki izin untuk mengelola isu. Role yang diizinkan: editor, section_editor.
          </div>
        </div>
      )
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
      console.log('[ISSUES PAGE] No journal found for tenant')
      return (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            Jurnal tidak ditemukan untuk tenant Anda.
          </div>
        </div>
      )
    }

    console.log('[ISSUES PAGE] User authorized, journal:', journal.id)
    
    // Pass user and journal data to client component
    return <IssuesClientPage user={user} journal={journal} />
    
  } catch (error: any) {
    console.error('[ISSUES PAGE] Error checking authorization:', error)
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          Terjadi kesalahan saat memverifikasi akses: {error.message}
        </div>
      </div>
    )
  }
}