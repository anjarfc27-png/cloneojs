import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // First, let's get all tenant users with their roles
    const { data: tenantUsers, error: tenantError } = await supabase
      .from('tenant_users')
      .select('user_id, role, tenant_id, is_active')
      .order('created_at', { ascending: false })

    if (tenantError) {
      console.error('Error fetching tenant users:', tenantError)
      return NextResponse.json(
        { error: 'Failed to fetch tenant users', details: tenantError.message },
        { status: 500 }
      )
    }

    // For each user_id, get their email from profiles or auth metadata
    const userIds = tenantUsers?.map(tu => tu.user_id) || []
    
    if (userIds.length === 0) {
      return NextResponse.json({
        users: [],
        total: 0,
        super_admins: 0
      })
    }

    // Try to get from profiles table first
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    let usersWithEmails = []
    
    if (!profilesError && profiles && profiles.length > 0) {
      // Use profiles data
      usersWithEmails = tenantUsers?.map(tenantUser => {
        const profile = profiles.find(p => p.id === tenantUser.user_id)
        return {
          id: tenantUser.user_id,
          email: profile?.email || 'unknown@email.com',
          role: tenantUser.role,
          tenant_id: tenantUser.tenant_id,
          is_active: tenantUser.is_active
        }
      }) || []
    } else {
      // Fallback: just return with user_id as identifier
      usersWithEmails = tenantUsers?.map(tenantUser => ({
        id: tenantUser.user_id,
        email: `${tenantUser.user_id.substring(0, 8)}...@...`,
        role: tenantUser.role,
        tenant_id: tenantUser.tenant_id,
        is_active: tenantUser.is_active
      })) || []
    }

    return NextResponse.json({
      users: usersWithEmails,
      total: usersWithEmails.length,
      super_admins: usersWithEmails.filter(u => u.role === 'super_admin').length
    })

  } catch (error: any) {
    console.error('Error listing users:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}