/**
 * User Service for Admin Dashboard
 * Functions to interact with Supabase for user management
 */

import { createClient } from '@/lib/supabase/server'

export interface UserWithRole {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
  tenant_id?: string
  tenant_name?: string
}

export interface UserFormData {
  email: string
  password?: string
  full_name: string
  role: 'super_admin' | 'editor' | 'section_editor' | 'reviewer' | 'author' | 'reader'
  is_active: boolean
  tenant_id?: string
}

/**
 * Get all users with their roles
 * TODO: Replace with actual Supabase query
 */
export async function getUsers(page: number = 1, limit: number = 10, search?: string): Promise<{
  users: UserWithRole[]
  total: number
}> {
  const supabase = await createClient()
  
  // Get users from auth.users (via API route since we need admin access)
  // For now, return placeholder data
  // In production, this should call an API route that uses service role
  
  const placeholderUsers: UserWithRole[] = [
    {
      id: '1',
      email: 'admin@example.com',
      full_name: 'Super Admin',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'editor@example.com',
      full_name: 'Dr. Ahmad Fauzi',
      role: 'editor',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'reviewer@example.com',
      full_name: 'Prof. Budi Santoso',
      role: 'reviewer',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '4',
      email: 'author@example.com',
      full_name: 'Dr. Sarah Wijaya',
      role: 'author',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ]

  // Filter by search if provided
  let filteredUsers = placeholderUsers
  if (search) {
    const searchLower = search.toLowerCase()
    filteredUsers = placeholderUsers.filter(
      (user) =>
        user.email.toLowerCase().includes(searchLower) ||
        (user.full_name?.toLowerCase().includes(searchLower) ?? false)
    )
  }

  // Pagination
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedUsers = filteredUsers.slice(start, end)

  return {
    users: paginatedUsers,
    total: filteredUsers.length,
  }
}

/**
 * Create a new user
 * TODO: Replace with actual Supabase Admin API call via API route
 */
export async function createUser(data: UserFormData): Promise<{ success: boolean; error?: string }> {
  // This should call an API route that uses Supabase Admin API
  // For now, return success
  return { success: true }
}

/**
 * Update a user
 * TODO: Replace with actual Supabase Admin API call via API route
 */
export async function updateUser(
  id: string,
  data: Partial<UserFormData>
): Promise<{ success: boolean; error?: string }> {
  // This should call an API route that uses Supabase Admin API
  return { success: true }
}

/**
 * Delete a user
 * TODO: Replace with actual Supabase Admin API call via API route
 */
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  // This should call an API route that uses Supabase Admin API
  return { success: true }
}

