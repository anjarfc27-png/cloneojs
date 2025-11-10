'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import LoginForm from './LoginForm'

export default function LoginContent() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 max-w-2xl mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link href="/" className="text-[#0056A1] hover:text-[#003d5c] hover:underline">
              {t.home}
            </Link>
          </li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-700">{t.login}</li>
        </ol>
      </nav>

      {/* Content Area */}
      <div className="bg-white">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t.loginTitle}</h1>

        {/* Login Form */}
        <div className="max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

