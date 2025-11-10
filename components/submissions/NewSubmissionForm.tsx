'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Journal {
  id: string
  title: string
}

interface NewSubmissionFormProps {
  journals: Journal[]
}

export default function NewSubmissionForm({ journals }: NewSubmissionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    journal_id: '',
    title: '',
    abstract: '',
    keywords: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          journal_id: formData.journal_id,
          submitter_id: user.id,
          title: formData.title,
          abstract: formData.abstract,
          keywords: keywordsArray,
          status: 'draft',
        })

      if (submissionError) throw submissionError

      router.push('/dashboard/submissions')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Terjadi kesalahan saat membuat submission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="journal_id" className="block text-sm font-medium text-gray-700">
            Pilih Jurnal *
          </label>
          <select
            id="journal_id"
            required
            value={formData.journal_id}
            onChange={(e) => setFormData({ ...formData, journal_id: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Pilih Jurnal --</option>
            {journals.map((journal) => (
              <option key={journal.id} value={journal.id}>
                {journal.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Judul Artikel *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Masukkan judul artikel"
          />
        </div>

        <div>
          <label htmlFor="abstract" className="block text-sm font-medium text-gray-700">
            Abstrak *
          </label>
          <textarea
            id="abstract"
            required
            rows={6}
            value={formData.abstract}
            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Masukkan abstrak artikel"
          />
        </div>

        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
            Kata Kunci
          </label>
          <input
            type="text"
            id="keywords"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Pisahkan dengan koma (contoh: penelitian, metode, analisis)"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan sebagai Draft'}
          </button>
        </div>
      </form>
    </div>
  )
}

