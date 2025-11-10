import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/journals/editors - Get all editors for dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('role', 'super_admin')
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all editors from tenant_users
    const { data: tenantEditors, error } = await supabase
      .from('tenant_users')
      .select('user_id, tenant_id')
      .eq('role', 'editor')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching editors:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get unique user IDs
    const userIds = [...new Set(tenantEditors?.map((te: any) => te.user_id) || [])]

    // Build editors array
    // Note: We can't directly query auth.users, so we'll use placeholder
    // In production, use Supabase Admin API to get user emails
    const editors = userIds.map((userId: string) => ({
      id: userId,
      name: `Editor ${userId.substring(0, 8)}`, // Placeholder
      email: `editor-${userId.substring(0, 8)}@example.com`, // Placeholder
    }))

    return NextResponse.json({ editors })
  } catch (error: any) {
    console.error('Error in GET /api/admin/journals/editors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

