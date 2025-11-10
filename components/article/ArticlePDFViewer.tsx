'use client'

import { getEmbedUrl } from '@/lib/google-drive'

interface ArticlePDFViewerProps {
  webViewLink: string
}

export default function ArticlePDFViewer({ webViewLink }: ArticlePDFViewerProps) {
  const embedUrl = getEmbedUrl(webViewLink)

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4">Full Text</h2>
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
        <iframe
          src={embedUrl}
          className="w-full h-[800px] border-0"
          title="Article PDF"
          allow="fullscreen"
        />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <a
          href={webViewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--ojs-primary)] hover:underline"
        >
          Buka di tab baru →
        </a>
      </div>
    </div>
  )
}

