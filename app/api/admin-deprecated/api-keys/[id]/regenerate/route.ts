import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/admin/auth'
import { logActivity } from '@/lib/admin/dashboard'
import { randomBytes } from 'crypto'

/**
 * POST /api/admin/api-keys/[id]/regenerate
 * Regenerate API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()
    const supabase = await createClient()

    // Generate new API key
    const newApiKey = `ojs_${randomBytes(32).toString('hex')}`

    const { data, error } = await supabase
      .from('api_keys')
      .update({
        api_key: newApiKey,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error regenerating API key:', error)
      return NextResponse.json(
        { error: 'Failed to regenerate API key', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    await logActivity(
      'api_key_regenerated',
      'api_key',
      params.id,
      { key_name: data.key_name }
    )

    return NextResponse.json({
      message: 'API key regenerated successfully',
      api_key: data,
      // Return the full key only once for user to copy
      full_key: newApiKey,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/api-keys/[id]/regenerate:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}


