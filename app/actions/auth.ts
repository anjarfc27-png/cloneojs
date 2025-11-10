'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(email: string, password: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.user || !data.session) {
    return { error: 'Login gagal, silakan coba lagi' }
  }

  // Redirect to dashboard
  redirect('/dashboard')
}

