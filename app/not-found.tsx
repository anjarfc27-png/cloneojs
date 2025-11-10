import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">404 - Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-4">
          Halaman yang Anda cari tidak ada.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 inline-block"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}

