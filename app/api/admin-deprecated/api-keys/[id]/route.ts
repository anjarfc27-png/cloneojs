import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'
import { randomBytes } from 'crypto'

/**
 * GET /api/admin/api-keys/[id]
 * Get single API key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching API key:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API key', details: error.message },
        { status: 500 }
      )
    }

    // Don't return the full API key
    return NextResponse.json({
      api_key: {
        ...apiKey,
        api_key: apiKey.api_key ? `${apiKey.api_key.substring(0, 8)}...` : null,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/api-keys/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/api-keys/[id]
 * Update API key
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck
    const body = await request.json()

    const { key_name, permissions, expires_at, enabled } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (key_name !== undefined) updateData.key_name = key_name
    if (permissions !== undefined) updateData.permissions = permissions
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (enabled !== undefined) updateData.enabled = enabled

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating API key:', error)
      return NextResponse.json(
        { error: 'Failed to update API key', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'api_key_updated',
      'api_key',
      params.id,
      { key_name: data.key_name }
    )

    return NextResponse.json({
      message: 'API key updated successfully',
      api_key: {
        ...data,
        api_key: data.api_key ? `${data.api_key.substring(0, 8)}...` : null,
      },
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/api-keys/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/api-keys/[id]
 * Delete API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json(
        { error: 'Failed to delete API key', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'api_key_deleted',
      'api_key',
      params.id,
      {}
    )

    return NextResponse.json({
      message: 'API key deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/api-keys/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


