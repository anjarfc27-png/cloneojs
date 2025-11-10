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
      console.log('User already logged in, redirecting to dashboard...')
      redirect('/dashboard')
    }
  } catch (error: any) {
    console.log('Supabase not configured yet or error:', error?.message)
  }

  return <LoginPageClient />
}
