'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AdminAuthContextValue {
  user: User | null
  isReady: boolean
  setUser: (user: User | null) => void
  getAccessToken: () => Promise<string | undefined>
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

export function AdminAuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null
  children: React.ReactNode
}) {
  const [userState, setUserState] = useState<User | null>(initialUser)
  const [isReady, setIsReady] = useState<boolean>(!!initialUser)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  const ensureClient = useCallback(() => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser)
    setIsReady(!!nextUser)
  }, [])

  const getAccessToken = useCallback(async () => {
    try {
      const supabase = ensureClient()
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('[AdminAuthProvider] Error getting session token:', error.message)
        return undefined
      }
      return data?.session?.access_token || undefined
    } catch (error: any) {
      console.error('[AdminAuthProvider] Unexpected error getting session token:', error?.message)
      return undefined
    }
  }, [ensureClient])

  return (
    <AdminAuthContext.Provider value={{ user: userState, setUser, getAccessToken, isReady }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

