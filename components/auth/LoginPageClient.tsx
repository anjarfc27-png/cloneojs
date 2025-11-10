'use client'

import { TranslationProvider } from '@/lib/i18n/useTranslation'
import LoginForm from './LoginForm'
import LoginHeader from '@/components/layout/LoginHeader'
import LanguageSidebar from './LanguageSidebar'
import LoginContent from './LoginContent'

export default function LoginPageClient() {
  return (
    <TranslationProvider>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Login Header */}
        <LoginHeader />

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left: Login Form */}
          <LoginContent />

          {/* Right: Language Sidebar */}
          <LanguageSidebar />
        </div>
      </div>
    </TranslationProvider>
  )
}

