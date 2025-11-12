/**
 * Get current authenticated user
 * 
 * This function retrieves the current user from the session.
 * Use this in Server Components and Server Actions.
 */

import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('[getCurrentUser] Error getting user:', error.message)
    return null
  }

  return user
}



