import { Activity } from '@/lib/admin/dashboard'
import { formatDistanceToNow } from 'date-fns'
import {
  UserPlus,
  BookOpen,
  Settings,
  FileText,
  CheckCircle,
} from 'lucide-react'

interface ActivityTableProps {
  activities: Activity[]
}

const activityIcons = {
  user_created: UserPlus,
  journal_approved: BookOpen,
  settings_changed: Settings,
  submission_received: FileText,
  review_completed: CheckCircle,
}

const activityColors = {
  user_created: 'text-blue-600 bg-blue-50',
  journal_approved: 'text-green-600 bg-green-50',
  settings_changed: 'text-orange-600 bg-orange-50',
  submission_received: 'text-purple-600 bg-purple-50',
  review_completed: 'text-indigo-600 bg-indigo-50',
}

export default function ActivityTable({ activities }: ActivityTableProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <p className="text-center text-gray-500">Tidak ada aktivitas terbaru</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Waktu
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktivitas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pengguna
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Detail
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]

              return (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(activity.timestamp, {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${colorClass} mr-3`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.userName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {activity.details || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

