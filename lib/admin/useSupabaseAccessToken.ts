'use client'

import { useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook untuk mengambil Supabase access token di sisi klien.
 * Token ini dikirim ke Server Action untuk otorisasi super admin.
 */
export function useSupabaseAccessToken() {
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null)

  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    try {
      if (!clientRef.current) {
        clientRef.current = createClient()
      }

      const { data, error } = await clientRef.current.auth.getSession()
      if (error) {
        console.error('[useSupabaseAccessToken] Error getSession:', error.message)
        return undefined
      }

      return data?.session?.access_token || undefined
    } catch (err: any) {
      console.error('[useSupabaseAccessToken] Unexpected error:', err?.message)
      return undefined
    }
  }, [])

  return getAccessToken
}


