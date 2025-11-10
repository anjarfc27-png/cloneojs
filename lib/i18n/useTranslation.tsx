'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Language, translations, languageNames } from './translations'

export type { Language }

interface TranslationContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
  languageNames: typeof languageNames
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('ojs-language') as Language | null
    if (savedLanguage && savedLanguage in translations) {
      setLanguageState(savedLanguage)
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('es')) {
        setLanguageState('es')
      } else if (browserLang.startsWith('fr')) {
        setLanguageState(browserLang.includes('ca') ? 'fr-ca' : 'fr')
      } else if (browserLang.startsWith('pt')) {
        setLanguageState(browserLang.includes('br') ? 'pt-br' : 'pt')
      } else if (browserLang.startsWith('ru')) {
        setLanguageState('ru')
      } else if (browserLang.startsWith('ar')) {
        setLanguageState('ar')
      } else if (browserLang.startsWith('id')) {
        setLanguageState('id')
      }
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('ojs-language', lang)
  }

  const contextValue: TranslationContextType = {
    language,
    setLanguage,
    t: translations[language],
    languageNames,
  }

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}

