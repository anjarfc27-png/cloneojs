import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function JournalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth is handled by DashboardAuthGuard in layout
  // Get user's journals through tenant_users (only if user exists)
  const { data: tenantUsers } = user ? await supabase
    .from('tenant_users')
    .select(`
      *,
      tenants:tenant_id (
        *,
        journals:journals!tenant_id (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true) : { data: null }

  const journals: any[] = []
  tenantUsers?.forEach((tu: any) => {
    if (tu.tenants?.journals) {
      journals.push(...tu.tenants.journals.map((j: any) => ({
        ...j,
        role: tu.role,
        tenant: tu.tenants,
      })))
    }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Journals</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {journals && journals.length > 0 ? (
          journals.map((journal: any) => (
            <div key={journal.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{journal.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{journal.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Role: {journal.role}</span>
                <Link
                  href={`/dashboard/journals/${journal.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Kelola →
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-8 text-center text-gray-500">
            <p>Anda belum terdaftar di jurnal manapun.</p>
          </div>
        )}
      </div>
    </div>
  )
}

