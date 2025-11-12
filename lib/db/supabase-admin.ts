/**
 * Supabase Admin Client
 * 
 * This client uses the service role key to bypass RLS policies.
 * Only use this in Server Actions with proper authorization checks.
 * 
 * NEVER expose this client to the client-side.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
    'This is required for server-side operations that need to bypass RLS.'
  )
}

/**
 * Create Supabase admin client with service role key
 * This client bypasses RLS and should only be used in Server Actions
 * with proper authorization checks (e.g., checkSuperAdmin first)
 */
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}



