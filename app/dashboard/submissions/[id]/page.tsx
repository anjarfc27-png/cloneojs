import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SubmissionDetail from '@/components/submissions/SubmissionDetail'
import AssignReviewerForm from '@/components/submissions/AssignReviewerForm'
import ReviewDecisionForm from '@/components/submissions/ReviewDecisionForm'
import PublishArticleForm from '@/components/submissions/PublishArticleForm'

export default async function SubmissionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Auth is handled by DashboardAuthGuard in layout
  // Get submission (only if user exists)
  const { data: submission } = user ? await supabase
    .from('submissions')
    .select(`
      *,
      journals:journal_id (
        *,
        tenants:tenant_id (
          *,
          tenant_users (*)
        )
      ),
      sections:section_id (*),
      submission_authors (*),
      submission_files (*,
        google_drive_files (*)
      ),
      review_assignments (
        *,
        reviewers:reviewer_id (
          email
        )
      ),
      editorial_decisions (*)
    `)
    .eq('id', params.id)
    .single() : { data: null }

  if (!submission || !user) {
    return <div>Loading...</div>
  }

  // Check access
  const isAuthor = submission.submitter_id === user.id
  
  // Check if user is editor/super_admin in the journal's tenant
  // First, get user's tenant roles
  const { data: userTenantRoles } = await supabase
    .from('tenant_users')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
  
  const journalTenantId = submission.journals?.tenants?.id || submission.journals?.tenant_id
  
  const isEditor = userTenantRoles?.some(
    (tu: any) => tu.tenant_id === journalTenantId && 
    ['editor', 'section_editor', 'super_admin'].includes(tu.role)
  )

  if (!isAuthor && !isEditor) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Anda tidak memiliki akses untuk melihat submission ini.</p>
        <a href="/dashboard/submissions" className="text-indigo-600 hover:text-indigo-900">
          Kembali ke Submissions
        </a>
      </div>
    )
  }

  // Get available reviewers for editor
  let reviewers: any[] = []
  if (isEditor) {
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select(`
        *,
        users:user_id (
          id,
          email
        )
      `)
      .eq('tenant_id', submission.journals.tenants.id)
      .eq('role', 'reviewer')
      .eq('is_active', true)

    reviewers = tenantUsers || []
  }

  return (
    <div>
      <SubmissionDetail 
        submission={submission} 
        isAuthor={isAuthor}
        isEditor={isEditor}
      />

      {isEditor && submission.status === 'submitted' && (
        <div className="mt-6">
          <AssignReviewerForm 
            submissionId={params.id}
            reviewers={reviewers}
          />
        </div>
      )}

      {isEditor && submission.status === 'review_completed' && (
        <div className="mt-6">
          <ReviewDecisionForm submissionId={params.id} />
        </div>
      )}

      {isEditor && submission.status === 'accepted' && (
        <div className="mt-6">
          <PublishArticleForm submissionId={params.id} journalId={submission.journal_id} />
        </div>
      )}
    </div>
  )
}

