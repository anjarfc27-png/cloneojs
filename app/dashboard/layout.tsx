import DashboardAuthGuard from '@/components/dashboard/DashboardAuthGuard'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGuard>
      {children}
    </DashboardAuthGuard>
  )
}
