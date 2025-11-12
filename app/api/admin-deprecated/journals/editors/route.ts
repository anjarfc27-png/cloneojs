import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'

/**
 * GET /api/admin/journals/editors - Get all editors for dropdown
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

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

