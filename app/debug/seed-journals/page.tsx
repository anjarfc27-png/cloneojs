'use client';

import { useState } from 'react';

export default function SeedJournalsPage() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- Seed 3 tenants, journals, dan satu issue per jurnal
-- Jalankan di Supabase Dashboard > SQL Editor

-- 1) Tambahkan tenants demo (idempotent, UUID auto-generate)
INSERT INTO tenants (name, slug, description, is_active)
VALUES 
  ('Demo A Tenant', 'demo-a', 'Tenant demo A untuk pengujian', true),
  ('Demo B Tenant', 'demo-b', 'Tenant demo B untuk pengujian', true),
  ('Demo C Tenant', 'demo-c', 'Tenant demo C untuk pengujian', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 2) Buat jurnal satu per tenant (idempotent)
INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
SELECT t.id, 'Journal of Computer Science', 'A peer-reviewed journal covering computer science research', 'JCS', 'en', true
FROM tenants t
WHERE t.slug = 'demo-a'
AND NOT EXISTS (SELECT 1 FROM journals j WHERE j.tenant_id = t.id);

INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
SELECT t.id, 'Journal of Medical Research', 'A peer-reviewed journal covering medical research', 'JMR', 'en', true
FROM tenants t
WHERE t.slug = 'demo-b'
AND NOT EXISTS (SELECT 1 FROM journals j WHERE j.tenant_id = t.id);

INSERT INTO journals (tenant_id, title, description, abbreviation, language, is_active)
SELECT t.id, 'Journal of Environmental Studies', 'A peer-reviewed journal covering environmental research', 'JES', 'en', true
FROM tenants t
WHERE t.slug = 'demo-c'
AND NOT EXISTS (SELECT 1 FROM journals j WHERE j.tenant_id = t.id);

-- 3) Buat satu issue per jurnal (idempotent)
INSERT INTO issues (journal_id, volume, number, year, title, description, published_date, is_published, access_status)
SELECT j.id, 1, '1', 2024, 'Volume 1 Number 1 (2024)', 'First issue of Journal of Computer Science', '2024-01-15', true, 'open'
FROM journals j
JOIN tenants t ON t.id = j.tenant_id
WHERE t.slug = 'demo-a'
AND NOT EXISTS (
  SELECT 1 FROM issues i WHERE i.journal_id = j.id AND i.volume = 1 AND i.number = '1' AND i.year = 2024
);

INSERT INTO issues (journal_id, volume, number, year, title, description, published_date, is_published, access_status)
SELECT j.id, 1, '1', 2024, 'Volume 1 Number 1 (2024)', 'First issue of Journal of Medical Research', '2024-02-01', true, 'open'
FROM journals j
JOIN tenants t ON t.id = j.tenant_id
WHERE t.slug = 'demo-b'
AND NOT EXISTS (
  SELECT 1 FROM issues i WHERE i.journal_id = j.id AND i.volume = 1 AND i.number = '1' AND i.year = 2024
);

INSERT INTO issues (journal_id, volume, number, year, title, description, published_date, is_published, access_status)
SELECT j.id, 1, '1', 2024, 'Volume 1 Number 1 (2024)', 'First issue of Journal of Environmental Studies', '2024-03-01', true, 'open'
FROM journals j
JOIN tenants t ON t.id = j.tenant_id
WHERE t.slug = 'demo-c'
AND NOT EXISTS (
  SELECT 1 FROM issues i WHERE i.journal_id = j.id AND i.volume = 1 AND i.number = '1' AND i.year = 2024
);

-- 4) Verifikasi hasil
SELECT 
  t.slug AS tenant_slug,
  j.title AS journal_title,
  j.is_active AS journal_active,
  COUNT(i.id) AS issue_count
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id
LEFT JOIN issues i ON i.journal_id = j.id
WHERE t.slug IN ('demo-a','demo-b','demo-c')
GROUP BY t.slug, j.title, j.is_active
ORDER BY t.slug;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Seed 3 Jurnal Demo
            </h1>
            <button
              onClick={copyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy SQL
                </>
              )}
            </button>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Instructions:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Copy the SQL script below using the button above</li>
              <li>Open Supabase Dashboard and go to SQL Editor</li>
              <li>Paste and run the SQL script</li>
              <li>After execution, you can access the demo journals at:</li>
            </ol>
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <p className="font-medium text-gray-800 mb-2">Demo Journal URLs:</p>
              <ul className="space-y-1 text-sm">
                <li>• <a href="http://localhost:3000/demo-a" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:3000/demo-a</a> - Journal of Computer Science</li>
                <li>• <a href="http://localhost:3000/demo-b" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:3000/demo-b</a> - Journal of Medical Research</li>
                <li>• <a href="http://localhost:3000/demo-c" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:3000/demo-c</a> - Journal of Environmental Studies</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 rounded-md p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm whitespace-pre-wrap">
              {sqlScript}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}