import { getDashboardStats, getRecentActivities } from '@/actions/dashboard/get'
import StatsCard from '@/components/admin/StatsCard'
import ActivityTable from '@/components/admin/ActivityTable'
import ContentCard from '@/components/shared/ContentCard'
import { Users, BookOpen, UserCheck, FileText, Building2, Newspaper, Calendar } from 'lucide-react'

export default async function AdminDashboardPage() {
  // Get dashboard data using Server Actions
  const stats = await getDashboardStats()
  const activities = await getRecentActivities(10)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Super Admin</h1>
        <p className="text-gray-600">Ringkasan sistem dan aktivitas terbaru</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Pengguna"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Jurnal"
          value={stats.totalJournals}
          icon={BookOpen}
          color="green"
        />
        <StatsCard
          title="Tenant Aktif"
          value={stats.activeTenants}
          icon={Building2}
          color="purple"
        />
        <StatsCard
          title="Editor Aktif"
          value={stats.activeEditors}
          icon={UserCheck}
          color="orange"
        />
        <StatsCard
          title="Total Artikel"
          value={stats.totalArticles}
          icon={Newspaper}
          color="purple"
        />
        <StatsCard
          title="Total Issues"
          value={stats.totalIssues}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Submisi Bulan Ini"
          value={stats.submissionsThisMonth}
          icon={FileText}
          color="green"
        />
      </div>

      {/* Recent Activities */}
      <ContentCard>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Aktivitas Terkini</h2>
          <p className="text-sm text-gray-600">Log aktivitas sistem terbaru</p>
        </div>
        <ActivityTable activities={activities} />
      </ContentCard>
    </div>
  )
}
