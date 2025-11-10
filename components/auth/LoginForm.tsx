'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

export default function LoginForm() {
  const router = useRouter()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    setError(null)
    setLoading(true)

    try {
      console.log('[LOGIN] Starting login process...')
      const supabase = createClient()
      
      console.log('[LOGIN] Calling signInWithPassword...')
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginError) {
        console.error('[LOGIN] Login error:', loginError.message)
        setError(loginError.message || t.invalidCredentials)
        setLoading(false)
        return
      }

      if (!data?.user || !data?.session) {
        console.error('[LOGIN] No user or session in response')
        setError(t.invalidCredentials)
        setLoading(false)
        return
      }

      console.log('[LOGIN] ✅ Login successful! User:', data.user.email)
      console.log('[LOGIN] Session exists:', !!data.session)

      // Small delay to ensure cookies are synced
      console.log('[LOGIN] Waiting 150ms for cookie sync...')
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Verify session is accessible
      const { data: { session: verifySession } } = await supabase.auth.getSession()
      if (verifySession) {
        console.log('[LOGIN] ✅ Session verified, redirecting...')
      } else {
        console.warn('[LOGIN] ⚠️ Session not immediately available, redirecting anyway...')
      }
      
      // Use window.location.href for reliable redirect with session
      console.log('[LOGIN] Redirecting to /dashboard')
      window.location.href = '/dashboard'
      
    } catch (error: any) {
      console.error('[LOGIN] ❌ Unexpected error during login:', error)
      setError(error.message || t.invalidCredentials)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-600 text-white px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* Required fields notice */}
      <p className="text-sm text-gray-600">
        {t.requiredFields} <span className="text-red-500">*</span>
      </p>

      {/* Username Field */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          {t.username} <span className="text-red-500">*</span>
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          {t.password} <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0056A1] focus:border-[#0056A1] text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <div className="mt-1 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-[#0056A1] hover:text-[#003d5c] hover:underline"
          >
            {t.forgotPassword}
          </Link>
        </div>
      </div>

      {/* Keep me logged in checkbox */}
      <div className="flex items-center">
        <input
          id="keepLoggedIn"
          name="keepLoggedIn"
          type="checkbox"
          checked={keepLoggedIn}
          onChange={(e) => setKeepLoggedIn(e.target.checked)}
          className="h-4 w-4 text-[#0056A1] focus:ring-[#0056A1] border-gray-300 rounded"
          disabled={loading}
        />
        <label htmlFor="keepLoggedIn" className="ml-2 block text-sm text-gray-700">
          {t.keepLoggedIn}
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/register"
          className="text-sm text-[#0056A1] hover:text-[#003d5c] hover:underline font-medium"
        >
          {t.register}
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : t.loginButton}
        </button>
      </div>
    </form>
  )
}
