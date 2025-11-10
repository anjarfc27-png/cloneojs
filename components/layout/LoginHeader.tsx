'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function LoginHeader() {
  const { t } = useTranslation()

  return (
    <header className="bg-[#003049] text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo OJS + Branding */}
        <div className="flex items-center space-x-3">
          {/* OJS Logo (Text-based) */}
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-md">
            <span className="text-[#003049] font-bold text-lg">OJS</span>
          </div>
          {/* Branding Text */}
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{t.openJournalSystems}</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex items-center space-x-4">
          <Link
            href="/register"
            className="text-white hover:text-gray-200 transition-colors"
          >
            {t.register}
          </Link>
          <Link
            href="/login"
            className="text-white hover:text-gray-200 transition-colors font-semibold"
          >
            {t.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
