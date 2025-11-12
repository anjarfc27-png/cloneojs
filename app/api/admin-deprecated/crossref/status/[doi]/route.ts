import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSuperAdmin } from '@/lib/admin/auth'
import { createCrossrefClient } from '@/lib/crossref/client'

/**
 * GET /api/admin/crossref/status/[doi]
 * Check DOI status in Crossref
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { doi: string } }
) {
  try {
    const authCheck = await checkSuperAdmin()
    if (!authCheck.authorized) {
      return authCheck.error!
    }
    const { supabase } = authCheck

    const doi = decodeURIComponent(params.doi)

    // Initialize Crossref client
    const crossrefClient = createCrossrefClient()

    // Check DOI status
    const status = await crossrefClient.getDOIStatus(doi)

    // Get DOI registration from database
    const { data: registration } = await supabase
      .from('doi_registrations')
      .select('*')
      .eq('doi', doi)
      .single()

    return NextResponse.json({
      doi,
      status: status.status,
      registered: status.registered,
      registered_date: status.registered_date,
      metadata: status.metadata,
      database_registration: registration,
    })
  } catch (error: any) {
    console.error('Error checking DOI status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
