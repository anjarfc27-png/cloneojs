-- Script untuk Verifikasi Demo Tenants
-- Jalankan script ini di Supabase Dashboard > SQL Editor untuk mengecek apakah demo tenants sudah ada

-- ============================================
-- 1. CEK TENANTS DEMO
-- ============================================
SELECT 
  'TENANTS' as check_type,
  t.id,
  t.name,
  t.slug,
  t.is_active,
  t.created_at,
  CASE 
    WHEN t.slug IN ('demo-a', 'demo-b', 'demo-c') THEN '✅ Found'
    ELSE '❌ Missing'
  END as status
FROM tenants t
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
ORDER BY t.slug;

-- ============================================
-- 2. CEK JOURNALS UNTUK SETIAP TENANT
-- ============================================
SELECT 
  'JOURNALS' as check_type,
  t.slug as tenant_slug,
  j.id as journal_id,
  j.title as journal_title,
  j.is_active as journal_active,
  j.created_at,
  CASE 
    WHEN j.id IS NOT NULL THEN '✅ Found'
    ELSE '❌ Missing'
  END as status
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id AND j.is_active = true
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
ORDER BY t.slug;

-- ============================================
-- 3. CEK ISSUES UNTUK SETIAP JOURNAL
-- ============================================
SELECT 
  'ISSUES' as check_type,
  t.slug as tenant_slug,
  j.title as journal_title,
  i.id as issue_id,
  i.volume,
  i.number,
  i.year,
  i.is_published,
  i.published_date,
  CASE 
    WHEN i.id IS NOT NULL THEN '✅ Found'
    ELSE '❌ Missing'
  END as status
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id AND j.is_active = true
LEFT JOIN issues i ON i.journal_id = j.id
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
ORDER BY t.slug, i.year DESC, i.volume DESC, i.number DESC;

-- ============================================
-- 4. CEK ARTICLES UNTUK SETIAP JOURNAL
-- ============================================
SELECT 
  'ARTICLES' as check_type,
  t.slug as tenant_slug,
  j.title as journal_title,
  COUNT(a.id) as article_count,
  CASE 
    WHEN COUNT(a.id) > 0 THEN '✅ Found (' || COUNT(a.id) || ' articles)'
    ELSE '⚠️ No articles'
  END as status
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id AND j.is_active = true
LEFT JOIN articles a ON a.journal_id = j.id AND a.published_date IS NOT NULL
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
GROUP BY t.slug, j.title
ORDER BY t.slug;

-- ============================================
-- 5. CEK SECTIONS UNTUK SETIAP JOURNAL
-- ============================================
SELECT 
  'SECTIONS' as check_type,
  t.slug as tenant_slug,
  j.title as journal_title,
  COUNT(s.id) as section_count,
  CASE 
    WHEN COUNT(s.id) > 0 THEN '✅ Found (' || COUNT(s.id) || ' sections)'
    ELSE '⚠️ No sections'
  END as status
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id AND j.is_active = true
LEFT JOIN sections s ON s.journal_id = j.id AND s.is_active = true
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
GROUP BY t.slug, j.title
ORDER BY t.slug;

-- ============================================
-- 6. SUMMARY REPORT
-- ============================================
SELECT 
  t.slug as tenant_slug,
  t.name as tenant_name,
  COUNT(DISTINCT j.id) as journal_count,
  COUNT(DISTINCT i.id) as issue_count,
  COUNT(DISTINCT a.id) as article_count,
  COUNT(DISTINCT s.id) as section_count,
  CASE 
    WHEN COUNT(DISTINCT j.id) > 0 
     AND COUNT(DISTINCT i.id) > 0 
    THEN '✅ Ready'
    WHEN COUNT(DISTINCT j.id) > 0 
    THEN '⚠️ Missing Issues'
    ELSE '❌ Missing Journal'
  END as readiness_status
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id AND j.is_active = true
LEFT JOIN issues i ON i.journal_id = j.id AND i.is_published = true
LEFT JOIN articles a ON a.journal_id = j.id AND a.published_date IS NOT NULL
LEFT JOIN sections s ON s.journal_id = j.id AND s.is_active = true
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
GROUP BY t.slug, t.name
ORDER BY t.slug;

-- ============================================
-- 7. CEK URL ACCESSIBILITY
-- ============================================
-- Query ini menampilkan URL yang bisa diakses untuk setiap tenant
SELECT 
  t.slug,
  'http://localhost:3000/' || t.slug as url,
  j.title as journal_title,
  CASE 
    WHEN j.id IS NOT NULL AND j.is_active = true THEN '✅ Accessible'
    ELSE '❌ Not Accessible'
  END as accessibility
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id AND j.is_active = true
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
ORDER BY t.slug;



