/**
 * Admin authentication utilities
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireSuperAdmin() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('[requireSuperAdmin] Error getting user:', userError)
      redirect('/login')
    }

    if (!user) {
      redirect('/login')
    }

    const { data: tenantUser, error: tenantError } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .single()

    if (tenantError) {
      console.error('[requireSuperAdmin] Error checking tenant user:', tenantError)
      redirect('/dashboard')
    }

    if (!tenantUser) {
      redirect('/dashboard')
    }

    return { user, supabase }
  } catch (error) {
    console.error('[requireSuperAdmin] Unexpected error:', error)
    redirect('/login')
  }
}

