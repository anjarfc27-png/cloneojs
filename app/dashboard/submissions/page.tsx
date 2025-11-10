import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ContentCard from '@/components/shared/ContentCard'
import SubmissionTabs from '@/components/submissions/SubmissionTabs'
import SubmissionTable from '@/components/submissions/SubmissionTable'

export default async function SubmissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let submissions = null

  if (user) {
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const isEditor = tenantUsers?.some(
      (tu: any) => ['super_admin', 'editor', 'section_editor'].includes(tu.role)
    )

    if (isEditor) {
      const tenantIds = tenantUsers?.map((tu: any) => tu.tenant_id) || []
      if (tenantIds.length > 0) {
        const { data: journals } = await supabase
          .from('journals')
          .select('id')
          .in('tenant_id', tenantIds)
        const journalIds = journals?.map((j: any) => j.id) || []
        if (journalIds.length > 0) {
          const { data } = await supabase
            .from('submissions')
            .select(`*, journals:journal_id (id, title), sections:section_id (id, title)`)
            .in('journal_id', journalIds)
            .order('created_at', { ascending: false })
          submissions = data
        }
      }
    } else {
      const { data } = await supabase
        .from('submissions')
        .select(`*, journals:journal_id (id, title), sections:section_id (id, title)`)
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false })
      submissions = data
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
      </div>

      {/* Content Card */}
      <ContentCard>
        <SubmissionTabs initialTab="my-queue" />
        <SubmissionTable submissions={submissions || []} />
      </ContentCard>
    </div>
  )
}
