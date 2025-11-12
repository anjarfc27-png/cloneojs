import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/debug/tenant-users - Debug endpoint to check tenant users data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's tenant info
    const { data: currentUser } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Get all tenant users with their roles
    const { data: allUsers, error } = await supabase
      .from('tenant_users')
      .select('id, user_id, tenant_id, role, is_active, created_at')
      .order('role', { ascending: true })

    if (error) {
      console.error('Error fetching tenant users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count users by role
    const roleCounts = allUsers?.reduce((acc: Record<string, number>, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      currentUser,
      allUsers: allUsers || [],
      roleCounts,
      totalUsers: allUsers?.length || 0,
      hasSuperAdmin: roleCounts['super_admin'] > 0,
      user: {
        id: user.id,
        email: user.email,
        role: currentUser?.role
      }
    })
  } catch (error: any) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}