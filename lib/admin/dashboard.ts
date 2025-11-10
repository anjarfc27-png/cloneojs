/**
 * Utility functions for Admin Dashboard
 * Placeholder functions - ready to be integrated with Supabase
 */

export interface DashboardStats {
  totalUsers: number
  totalJournals: number
  activeEditors: number
  submissionsThisMonth: number
}

export interface Activity {
  id: string
  timestamp: Date
  type: 'user_created' | 'journal_approved' | 'settings_changed' | 'submission_received' | 'review_completed'
  description: string
  userId: string
  userName: string
  details?: string
}

/**
 * Get dashboard statistics
 * TODO: Replace with actual Supabase query
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Placeholder data - replace with actual Supabase query
  return {
    totalUsers: 1250,
    totalJournals: 45,
    activeEditors: 89,
    submissionsThisMonth: 234,
  }
}

/**
 * Get recent activities
 * TODO: Replace with actual Supabase query
 */
export async function getRecentActivities(limit: number = 5): Promise<Activity[]> {
  // Placeholder data - replace with actual Supabase query
  const now = new Date()
  const activities: Activity[] = [
    {
      id: '1',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'user_created',
      description: 'Pengguna baru terdaftar',
      userId: 'user-1',
      userName: 'Dr. Ahmad Fauzi',
      details: 'Role: Editor',
    },
    {
      id: '2',
      timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'journal_approved',
      description: 'Jurnal disetujui',
      userId: 'user-2',
      userName: 'Admin System',
      details: 'Journal of Computer Science',
    },
    {
      id: '3',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      type: 'settings_changed',
      description: 'Pengaturan situs diubah',
      userId: 'user-3',
      userName: 'Super Admin',
      details: 'Site name updated',
    },
    {
      id: '4',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      type: 'submission_received',
      description: 'Submisi baru diterima',
      userId: 'user-4',
      userName: 'Dr. Sarah Wijaya',
      details: 'Article: Machine Learning Applications',
    },
    {
      id: '5',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      type: 'review_completed',
      description: 'Review selesai',
      userId: 'user-5',
      userName: 'Prof. Budi Santoso',
      details: 'Review for: Data Mining Techniques',
    },
  ]
  return activities.slice(0, limit)
}

