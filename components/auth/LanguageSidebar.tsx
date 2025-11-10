'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'
import { Language } from '@/lib/i18n/translations'

export default function LanguageSidebar() {
  const { t, setLanguage, languageNames } = useTranslation()

  const languages: Language[] = ['en', 'es', 'fr-ca', 'fr', 'pt-br', 'pt', 'ru', 'ar', 'id']

  return (
    <aside className="w-64 bg-white border-l border-gray-200 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{t.openJournalSystems}</h2>
        <h3 className="text-sm font-bold text-gray-700 mt-2">{t.language}</h3>
      </div>
      <nav>
        <ul className="space-y-1">
          {languages.map((lang) => (
            <li key={lang}>
              <button
                onClick={() => setLanguage(lang)}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                  lang === 'ar' || lang === 'ru'
                    ? 'text-right'
                    : 'text-left'
                } ${
                  // You can add active state if needed
                  'text-[#0056A1] hover:bg-gray-100 hover:text-[#003d5c]'
                }`}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                {languageNames[lang as keyof typeof languageNames]}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

