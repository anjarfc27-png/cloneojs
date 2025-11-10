import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/shared/ContentCard'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let tenantUsers = null
  if (user) {
    console.log('[DASHBOARD PAGE] ✅ User found:', user.email)
    const { data } = await supabase
      .from('tenant_users')
      .select(`*, tenants:tenant_id (*)`)
      .eq('user_id', user.id)
      .eq('is_active', true)
    tenantUsers = data
  } else {
    console.log('[DASHBOARD PAGE] ⚠️ No user on server, client guard will handle it')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Selamat datang di OJS Multi-Tenant</p>
      </div>

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
