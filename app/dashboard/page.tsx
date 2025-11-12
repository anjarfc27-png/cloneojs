import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContentCard from '@/components/shared/ContentCard'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.log('[DASHBOARD PAGE] ⚠️ No user on server, client guard will handle it')
  } else {
    console.log('[DASHBOARD PAGE] ✅ User found:', user.email)
    
    // Check if user is super admin (handle multiple entries)
    const { data: tenantUsers, error: roleError } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .limit(1)

    if (roleError) {
      console.log('[DASHBOARD PAGE] Error checking role (might not be super admin):', roleError.message)
    }

    // Redirect super admin to admin dashboard (check if any super_admin role exists)
    if (tenantUsers && tenantUsers.length > 0) {
      console.log('[DASHBOARD PAGE] User is super admin, redirecting to /admin/dashboard')
      redirect('/admin/dashboard')
    }
  }
  
  // Get tenant users for regular users
  let tenantUsers = null
  if (user) {
    const { data } = await supabase
      .from('tenant_users')
      .select(`*, tenants:tenant_id (*)`)
      .eq('user_id', user.id)
      .eq('is_active', true)
    tenantUsers = data
  }

  // Show info message if user might be super admin but not set up yet
  const mightBeSuperAdmin = user && user.email === 'anjarbdn@gmail.com'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Selamat datang di OJS Multi-Tenant</p>
      </div>

      {/* Super Admin Setup Info */}
      {mightBeSuperAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Setup Super Admin
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Akun Anda ({user.email}) mungkin perlu di-setup sebagai super admin. 
                  Jika Anda seharusnya menjadi super admin, klik tombol di bawah untuk setup.
                </p>
              </div>
              <div className="mt-4">
                <a
                  href="/debug/setup-super-admin"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Setup Super Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ContentCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Submissions</h3>
              <p className="text-sm text-gray-600">Kelola submission artikel</p>
            </div>
            <Link
              href="/dashboard/submissions"
              className="text-[#0056A1] hover:text-[#003f7f] font-medium"
            >
              Lihat →
            </Link>
          </div>
        </ContentCard>

        <ContentCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
              <p className="text-sm text-gray-600">Review artikel yang ditugaskan</p>
            </div>
            <Link
              href="/dashboard/reviews"
              className="text-[#0056A1] hover:text-[#003f7f] font-medium"
            >
              Lihat →
            </Link>
          </div>
        </ContentCard>

        <ContentCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Journals</h3>
              <p className="text-sm text-gray-600">Daftar jurnal yang tersedia</p>
            </div>
            <Link
              href="/dashboard/journals"
              className="text-[#0056A1] hover:text-[#003f7f] font-medium"
            >
              Lihat →
            </Link>
          </div>
        </ContentCard>
      </div>

      {/* Tenant Info */}
      {tenantUsers && tenantUsers.length > 0 && (
        <ContentCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenants & Roles</h3>
          <div className="space-y-2">
            {tenantUsers.map((tu: any) => (
              <div
                key={tu.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {tu.tenants?.name || 'Unknown Tenant'}
                  </p>
                  <p className="text-sm text-gray-600">Role: {tu.role}</p>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      )}
    </div>
  )
}
