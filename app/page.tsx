import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // Check if user is logged in, redirect to dashboard
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  } catch (error) {
    // Supabase not configured or error, show welcome page
    console.log('Supabase not configured yet or error')
  }

  // Welcome page
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">OJS Multi-Tenant System</h1>
      <p className="mt-2 text-gray-600">Sistem Manajemen Jurnal berbasis Next.js + Supabase</p>
      <a 
        href="/login" 
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Masuk
      </a>
    </main>
  )
}

