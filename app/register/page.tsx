import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RegisterForm from '@/components/auth/RegisterForm'
import OJSHeader from '@/components/layout/OJSHeader'
import OJSFooter from '@/components/layout/OJSFooter'
import Link from 'next/link'

export default async function RegisterPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  } catch (error) {
    // Supabase not configured, still show register page
    console.log('Supabase not configured yet')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* OJS Header */}
      <OJSHeader />

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8 w-full">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-[#0056A1] hover:text-[#003d5c] hover:underline">
                Home
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-700">Register</li>
          </ol>
        </nav>

        {/* Content Area */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Register</h1>

          {/* Register Form */}
          <div className="max-w-md mx-auto">
            <RegisterForm />
          </div>
        </div>
      </div>

      {/* OJS Footer */}
      <OJSFooter />
    </div>
  )
}

