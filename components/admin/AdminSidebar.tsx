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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
  { name: 'Manajemen Jurnal', href: '/admin/journals', icon: BookOpen },
  { name: 'Pengaturan Situs', href: '/admin/settings', icon: Settings },
  { name: 'Log Aktivitas', href: '/admin/activity-log', icon: FileText },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 pt-16 z-40">
      <nav className="p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#0056A1] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className={clsx('w-5 h-5 mr-3', isActive ? 'text-white' : 'text-gray-500')} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

