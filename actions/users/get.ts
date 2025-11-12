/**
 * Users Server Actions - Get
 * 
 * Server Actions for retrieving users.
 */

'use server'

import { createAdminClient } from '@/lib/db/supabase-admin'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { ServerActionAuthOptions } from '@/lib/admin/types'

export interface GetUsersParams {
  page?: number
  limit?: number
  search?: string
  accessToken?: string
}

export interface UserWithRoles {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  email_verified: boolean
  is_active: boolean
  roles: Array<{
    id: string
    role_key: string
    role_name: string
    journal_id: string | null
    journal_name: string | null
    tenant_id: string | null
    tenant_name: string | null
    is_active: boolean
  }>
  created_at: string
  updated_at: string | null
}

/**
 * Get all users with pagination and search
 */
export async function getUsers(params: GetUsersParams = {}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(params.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    const { page = 1, limit = 10, search = '' } = params

    // Get admin client
    const client = createAdminClient()

    // Get users from Supabase Auth (using Admin API)
    // Note: Supabase Admin API pagination is limited, so we'll fetch all and paginate in memory
    const { data: usersList, error: usersError } = await client.auth.admin.listUsers()

    if (usersError) {
      console.error('[getUsers] Error fetching users:', usersError)
      return {
        success: false,
        error: usersError.message,
        data: null,
      }
    }

    // Get user role assignments
    const { data: roleAssignments, error: assignmentsError } = await client
      .from('user_role_assignments')
      .select(`
        *,
        roles:role_id (
          id,
          role_key,
          name
        ),
        journals:journal_id (
          id,
          title
        ),
        tenants:tenant_id (
          id,
          name
        )
      `)
      .eq('is_active', true)

    if (assignmentsError) {
      console.error('[getUsers] Error fetching role assignments:', assignmentsError)
      // Continue without role assignments
    }

    // Create a map of user_id to role assignments
    const roleAssignmentsMap = new Map<string, any[]>()
    if (roleAssignments) {
      roleAssignments.forEach((ra: any) => {
        if (!roleAssignmentsMap.has(ra.user_id)) {
          roleAssignmentsMap.set(ra.user_id, [])
        }
        roleAssignmentsMap.get(ra.user_id)!.push({
          id: ra.id,
          role_key: ra.roles?.role_key || null,
          role_name: ra.roles?.name || null,
          journal_id: ra.journal_id,
          journal_name: ra.journals?.title || null,
          tenant_id: ra.tenant_id,
          tenant_name: ra.tenants?.name || null,
          is_active: ra.is_active,
        })
      })
    }

    // Also check legacy tenant_users table for backward compatibility
    const { data: tenantUsers, error: tenantUsersError } = await client
      .from('tenant_users')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name
        )
      `)
      .eq('is_active', true)

    if (!tenantUsersError && tenantUsers) {
      // Get role definitions
      const { data: roles } = await client
        .from('roles')
        .select('id, role_key, name')

      const rolesMap = new Map(roles?.map((r: any) => [r.role_key, r]) || [])

      tenantUsers.forEach((tu: any) => {
        if (!roleAssignmentsMap.has(tu.user_id)) {
          roleAssignmentsMap.set(tu.user_id, [])
        }
        const role = rolesMap.get(tu.role)
        if (role) {
          roleAssignmentsMap.get(tu.user_id)!.push({
            id: tu.id,
            role_key: role.role_key,
            role_name: role.name,
            journal_id: null,
            journal_name: null,
            tenant_id: tu.tenant_id,
            tenant_name: tu.tenants?.name || null,
            is_active: tu.is_active,
          })
        }
      })
    }

    // Transform users
    let usersWithRoles: UserWithRoles[] = (usersList?.users || []).map((user: any) => {
      const roles = roleAssignmentsMap.get(user.id) || []
      const userMetadata = user.user_metadata || {}
      const fullName = userMetadata.full_name || userMetadata.name || userMetadata.first_name
        ? `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim()
        : null

      return {
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        avatar_url: userMetadata.avatar_url || null,
        email_verified: user.email_confirmed_at !== null,
        is_active: user.banned_until === null && !user.deleted_at,
        roles: roles,
        created_at: user.created_at,
        updated_at: user.updated_at || null,
      }
    })

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      usersWithRoles = usersWithRoles.filter(
        (u) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.full_name?.toLowerCase().includes(searchLower) ||
          u.roles.some((r) => r.role_name?.toLowerCase().includes(searchLower))
      )
    }

    // Pagination
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = usersWithRoles.slice(start, end)

    return {
      success: true,
      data: {
        users: paginatedUsers,
        total: usersWithRoles.length,
        page,
        limit,
        totalPages: Math.ceil(usersWithRoles.length / limit),
      },
    }
  } catch (error: any) {
    console.error('[getUsers] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string, options: ServerActionAuthOptions = {}) {
  try {
    // Check authorization
    const authCheck = await checkSuperAdmin(options.accessToken)
    if (!authCheck.authorized) {
      return {
        success: false,
        error: 'Unauthorized',
        data: null,
      }
    }

    // Get admin client
    const client = createAdminClient()

    // Get user from Supabase Auth
    const { data: userData, error: userError } = await client.auth.admin.getUserById(userId)

    if (userError) {
      console.error('[getUserById] Error fetching user:', userError)
      return {
        success: false,
        error: userError.message,
        data: null,
      }
    }

    if (!userData?.user) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      }
    }

    const user = userData.user

    // Get user role assignments
    const { data: roleAssignments } = await client
      .from('user_role_assignments')
      .select(`
        *,
        roles:role_id (
          id,
          role_key,
          name
        ),
        journals:journal_id (
          id,
          title
        ),
        tenants:tenant_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    // Also check legacy tenant_users
    const { data: tenantUsers } = await client
      .from('tenant_users')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    // Transform role assignments
    const roles: UserWithRoles['roles'] = []
    
    if (roleAssignments) {
      roleAssignments.forEach((ra: any) => {
        roles.push({
          id: ra.id,
          role_key: ra.roles?.role_key || null,
          role_name: ra.roles?.name || null,
          journal_id: ra.journal_id,
          journal_name: ra.journals?.title || null,
          tenant_id: ra.tenant_id,
          tenant_name: ra.tenants?.name || null,
          is_active: ra.is_active,
        })
      })
    }

    // Add legacy tenant_users roles
    if (tenantUsers) {
      const { data: rolesData } = await client
        .from('roles')
        .select('id, role_key, name')

      const rolesMap = new Map(rolesData?.map((r: any) => [r.role_key, r]) || [])

      tenantUsers.forEach((tu: any) => {
        const role = rolesMap.get(tu.role)
        if (role) {
          roles.push({
            id: tu.id,
            role_key: role.role_key,
            role_name: role.name,
            journal_id: null,
            journal_name: null,
            tenant_id: tu.tenant_id,
            tenant_name: tu.tenants?.name || null,
            is_active: tu.is_active,
          })
        }
      })
    }

    const userMetadata = user.user_metadata || {}
    const fullName = userMetadata.full_name || userMetadata.name || userMetadata.first_name
      ? `${userMetadata.first_name || ''} ${userMetadata.last_name || ''}`.trim()
      : null

    const userWithRoles: UserWithRoles = {
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      avatar_url: userMetadata.avatar_url || null,
      email_verified: user.email_confirmed_at !== null,
      is_active: user.banned_until === null && !user.deleted_at,
      roles: roles,
      created_at: user.created_at,
      updated_at: user.updated_at || null,
    }

    return {
      success: true,
      data: userWithRoles,
    }
  } catch (error: any) {
    console.error('[getUserById] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: null,
    }
  }
}

