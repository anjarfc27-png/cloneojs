import SettingsForm from '@/components/settings/SettingsForm'

export default function SettingsPage() {
  // Auth is handled by DashboardAuthGuard in layout
  // SettingsForm will fetch user data from client-side

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
      <SettingsForm />
    </div>
  )
}

