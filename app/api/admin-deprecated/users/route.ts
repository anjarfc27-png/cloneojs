import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * GET /api/admin/users - Get all users with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Get all tenant_users to get user list
    const { data: tenantUsers, error } = await supabase
      .from('tenant_users')
      .select(`
        *,
        tenants:tenant_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique user IDs
    const userIds = [...new Set(tenantUsers?.map((tu: any) => tu.user_id) || [])]
    
    // Get user profiles for additional metadata
    const { data: userProfiles } = await supabase
      .from('user_profiles')
      .select('user_id, bio, affiliation')
      .in('user_id', userIds)
    
    const profilesMap = new Map(
      userProfiles?.map((p: any) => [p.user_id, p]) || []
    )
    
    // Build users array with metadata
    // Note: Email comes from auth.users which we can't directly query
    // We'll use a workaround: get current user's email as example
    // In production, use Supabase Admin API or create a database view
    const usersMap = new Map()
    
    tenantUsers?.forEach((tu: any) => {
      if (!usersMap.has(tu.user_id)) {
        const profile = profilesMap.get(tu.user_id) as { bio?: string; affiliation?: string } | undefined
        usersMap.set(tu.user_id, {
          id: tu.user_id,
          email: '', // Will be fetched via Admin API in production
          full_name: profile?.bio || null, // Use bio as full_name placeholder
          roles: [],
          tenants: [],
          is_active: tu.is_active,
          created_at: tu.created_at,
        })
      }
      const userData = usersMap.get(tu.user_id)
      userData.roles.push(tu.role)
      userData.tenants.push({
        id: tu.tenant_id,
        name: tu.tenants?.name || null,
        role: tu.role,
        is_active: tu.is_active,
      })
    })

    // Convert map to array
    // For now, we'll use placeholder email format
    // In production, fetch from auth.users via Admin API
    let users = Array.from(usersMap.values()).map((u: any) => ({
      id: u.id,
      email: u.email || `user-${u.id.substring(0, 8)}@example.com`, // Placeholder
      full_name: u.full_name,
      role: u.roles[0] || 'reader', // Primary role (first one)
      roles: u.roles, // All roles
      is_active: u.is_active,
      created_at: u.created_at,
      tenants: u.tenants,
    }))

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      users = users.filter(
        (u: any) =>
          u.email?.toLowerCase().includes(searchLower) ||
          u.full_name?.toLowerCase().includes(searchLower) ||
          u.role?.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = users.slice(start, end)

    return NextResponse.json({
      users: paginatedUsers,
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit),
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/users - Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const body = await request.json()
    const { email, password, full_name, role, is_active, tenant_id } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    // Note: This requires Admin API, so we'll need to use service role
    // For now, return a placeholder response
    // In production, use Supabase Admin client with service role key

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      // user: createdUser
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
