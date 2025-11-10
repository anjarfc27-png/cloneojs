import { createClient } from '@/lib/supabase/server'
import NewSubmissionForm from '@/components/submissions/NewSubmissionForm'

export default async function NewSubmissionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth is handled by DashboardAuthGuard in layout
  // Get user's active journals (only if user exists)
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
    const tenant = tu.tenants
    if (tenant && !Array.isArray(tenant) && tenant.journals) {
      const tenantJournals = Array.isArray(tenant.journals) ? tenant.journals : [tenant.journals]
      journals.push(...tenantJournals)
    } else if (tenant && Array.isArray(tenant)) {
      tenant.forEach((t: any) => {
        if (t.journals) {
          const tenantJournals = Array.isArray(t.journals) ? t.journals : [t.journals]
          journals.push(...tenantJournals)
        }
      })
    }
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Submission Baru</h1>
      <NewSubmissionForm journals={journals} />
    </div>
  )
}

