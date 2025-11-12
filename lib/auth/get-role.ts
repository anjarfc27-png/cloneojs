/**
 * Get user role
 * 
 * This function retrieves the user's role(s) from the database.
 * Returns both site-level and journal-level roles.
 */

import { createClient } from '@/lib/supabase/server'

export interface UserRole {
  role: string
  journal_id: string | null
  tenant_id: string | null
  is_active: boolean
}

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tenant_users')
    .select('role, tenant_id, journal_id:tenant_id, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    console.error('[getUserRoles] Error fetching roles:', error.message)
    return []
  }

  return (data || []).map((item: any) => ({
    role: item.role,
    journal_id: item.journal_id || null,
    tenant_id: item.tenant_id || null,
    is_active: item.is_active,
  }))
}

/**
 * Check if user has a specific role
 */
export async function hasRole(
  userId: string,
  role: string,
  journalId?: string | null
): Promise<boolean> {
  const roles = await getUserRoles(userId)
  
  return roles.some(
    (r) => r.role === role && (!journalId || r.journal_id === journalId)
  )
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'super_admin')
}

/**
 * Check if user is site admin (super admin or site admin)
 */
export async function isSiteAdmin(userId: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.some((r) => r.role === 'super_admin' || r.role === 'site_admin')
}



