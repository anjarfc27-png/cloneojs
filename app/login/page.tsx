import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginPageClient from '@/components/auth/LoginPageClient'

export default async function LoginPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error getting user in login page:', userError)
    }

    if (user) {
      console.log('User already logged in, checking role...')
      
      // Check if user is super admin (handle multiple entries)
      const { data: tenantUsers, error: roleError } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('role', 'super_admin')
        .limit(1)

      if (roleError) {
        console.log('Error checking role (might not be super admin):', roleError.message)
      }

      // Check if any super_admin role exists
      if (tenantUsers && tenantUsers.length > 0) {
        console.log('User is super admin, redirecting to /admin/dashboard')
        redirect('/admin/dashboard')
      } else {
        console.log('User is not super admin, redirecting to /dashboard')
        redirect('/dashboard')
      }
    }
  } catch (error: any) {
    console.log('Supabase not configured yet or error:', error?.message)
  }

  return <LoginPageClient />
}
