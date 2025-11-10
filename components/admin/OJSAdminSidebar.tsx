'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  FileText,
  Calendar,
} from 'lucide-react'

interface MenuGroup {
  title?: string
  items: MenuItem[]
}

interface MenuItem {
  name: string
  href: string
  icon?: any
}

const menuGroups: MenuGroup[] = [
  {
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
      { name: 'Manajemen Jurnal', href: '/admin/journals', icon: BookOpen },
      { name: 'Manajemen Isu', href: '/admin/issues', icon: Calendar },
      { name: 'Pengaturan Situs', href: '/admin/settings', icon: Settings },
      { name: 'Log Aktivitas', href: '/admin/activity-log', icon: FileText },
    ],
  },
]

interface OJSAdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function OJSAdminSidebar({ isOpen = true, onClose }: OJSAdminSidebarProps) {
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

