'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  FileText,
  BookOpen,
  Megaphone,
  CreditCard,
  Settings,
  Globe,
  Workflow,
  Package,
  Users,
  BarChart3,
  FileCheck,
  Activity,
  UserCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react'

interface MenuGroup {
  title?: string
  items: MenuItem[]
}

interface MenuItem {
  name: string
  href: string
  icon?: any
  badge?: number
}

const menuGroups: MenuGroup[] = [
  {
    items: [
      { name: 'Submissions', href: '/dashboard/submissions', icon: FileText },
      { name: 'Issues', href: '/dashboard/issues', icon: BookOpen },
      { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone },
      { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Settings',
    items: [
      { name: 'Journal', href: '/dashboard/settings/journal', icon: Settings },
      { name: 'Website', href: '/dashboard/settings/website', icon: Globe },
      { name: 'Workflow', href: '/dashboard/settings/workflow', icon: Workflow },
      { name: 'Distribution', href: '/dashboard/settings/distribution', icon: Package },
      { name: 'Users & Roles', href: '/dashboard/settings/users', icon: Users },
    ],
  },
  {
    title: 'Statistics',
    items: [
      { name: 'Articles', href: '/dashboard/statistics/articles', icon: FileCheck },
      { name: 'Editorial Activity', href: '/dashboard/statistics/activity', icon: Activity },
      { name: 'Users', href: '/dashboard/statistics/users', icon: UserCheck },
      { name: 'Reports', href: '/dashboard/statistics/reports', icon: TrendingUp },
    ],
  },
  {
    items: [
      { name: 'Tools', href: '/dashboard/tools', icon: Wrench },
    ],
  },
]

interface OJSSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function OJSSidebar({ isOpen = true, onClose }: OJSSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay for mobile */}
      {!isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-16 bottom-0 w-64 bg-[#E9ECEF] z-40 transition-transform duration-300 overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="p-4">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className={clsx(groupIndex > 0 && 'mt-6')}>
              {group.title && (
                <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  const Icon = item.icon

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={clsx(
                          'flex items-center justify-between px-4 py-2.5 rounded-md text-sm font-medium transition-colors relative',
                          isActive
                            ? 'bg-white text-[#0056A1] shadow-sm border-l-4 border-[#0056A1]'
                            : 'text-[#003049] hover:bg-gray-200'
                        )}
                      >
                        <div className="flex items-center">
                          {Icon && (
                            <Icon
                              className={clsx(
                                'w-5 h-5 mr-3',
                                isActive ? 'text-[#0056A1]' : 'text-gray-600'
                              )}
                            />
                          )}
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

