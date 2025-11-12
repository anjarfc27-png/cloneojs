import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'
import { randomBytes } from 'crypto'

/**
 * GET /api/admin/api-keys
 * Get all API keys
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    // Super admin can view all API keys
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys', details: error.message },
        { status: 500 }
      )
    }

    // Don't return the full API key for security (only show last 8 characters)
    const sanitizedKeys = (apiKeys || []).map(key => ({
      ...key,
      api_key: key.api_key ? `${key.api_key.substring(0, 8)}...` : null,
    }))

    return NextResponse.json({
      api_keys: sanitizedKeys,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/api-keys:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/api-keys
 * Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase, user } = authCheck
    const body = await request.json()

    const { key_name, permissions, expires_at } = body

    if (!key_name) {
      return NextResponse.json(
        { error: 'key_name is required' },
        { status: 400 }
      )
    }

    // Generate API key
    const apiKey = `ojs_${randomBytes(32).toString('hex')}`

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        key_name,
        api_key: apiKey,
        user_id: user.id,
        permissions: permissions || {},
        expires_at: expires_at || null,
        enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating API key:', error)
      return NextResponse.json(
        { error: 'Failed to create API key', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'api_key_created',
      'api_key',
      data.id,
      { key_name }
    )

    // Return full API key only on creation
    return NextResponse.json({
      message: 'API key created successfully',
      api_key: data,
      // Return the full key only once for user to copy
      full_key: apiKey,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/api-keys:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

