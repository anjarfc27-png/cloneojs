import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Journal {
  id: string
  title: string
  description?: string
  abbreviation?: string
  issn?: string
  e_issn?: string
  logo_url?: string
  tenants?: {
    id?: string
    name: string
    slug: string
  }
}

interface JournalHeaderProps {
  journal: Journal
  journalSlug?: string // Add journalSlug prop for navigation
}

export default async function JournalHeader({ journal, journalSlug }: JournalHeaderProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Use tenant slug if available, otherwise use journal ID
  const basePath = journalSlug || journal.tenants?.slug || journal.id

  return (
    <header className="bg-white border-b-2 border-[var(--ojs-primary)]">
      <div className="ojs-container py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {journal.logo_url && (
              <img 
                src={journal.logo_url} 
                alt={journal.title}
                className="h-16 w-auto"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-[var(--ojs-primary)]">
                {journal.title}
              </h1>
              {journal.abbreviation && (
                <p className="text-sm text-gray-600">{journal.abbreviation}</p>
              )}
            </div>
          </div>
          
          <nav className="flex items-center space-x-4">
            <Link 
              href={`/${basePath}`}
              className="text-[var(--ojs-primary)] hover:underline"
            >
              Beranda
            </Link>
            <Link 
              href={`/${basePath}/issues`}
              className="text-[var(--ojs-primary)] hover:underline"
            >
              Issues
            </Link>
            {user ? (
              <Link 
                href="/dashboard"
                className="ojs-button-primary"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-[var(--ojs-primary)] hover:underline"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register"
                  className="ojs-button-primary"
                >
                  Daftar
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

