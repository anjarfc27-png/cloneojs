import { requireSuperAdmin } from '@/lib/admin/auth'
import AdminLayoutWrapper from '@/components/layout/AdminLayoutWrapper'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // requireSuperAdmin will redirect if user is not super admin
  const { user } = await requireSuperAdmin()

  return (
    <AdminLayoutWrapper user={user}>
      {children}
    </AdminLayoutWrapper>
  )
}
