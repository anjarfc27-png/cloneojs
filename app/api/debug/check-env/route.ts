/**
 * Debug endpoint to check if environment variables are loaded correctly
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    success: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
        length: supabaseUrl?.length || 0,
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!supabaseAnonKey,
        value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : null,
        length: supabaseAnonKey?.length || 0,
        isJWT: supabaseAnonKey?.startsWith('eyJ') || false,
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!supabaseServiceRoleKey,
        value: supabaseServiceRoleKey ? `${supabaseServiceRoleKey.substring(0, 20)}...` : null,
        length: supabaseServiceRoleKey?.length || 0,
        isJWT: supabaseServiceRoleKey?.startsWith('eyJ') || false,
        // Note: JWT is encoded, so we can't check for "service_role" in the token
        // But if it's a valid JWT and exists, it should be the service role key
        hasServiceRole: supabaseServiceRoleKey ? 'JWT token (encoded)' : false,
      },
    },
    allSet: !!(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey),
    diagnosis: {
      canCreateServerClient: !!(supabaseUrl && supabaseAnonKey),
      canCreateAdminClient: !!(supabaseUrl && supabaseServiceRoleKey),
      ready: !!(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey),
    },
  })
}

