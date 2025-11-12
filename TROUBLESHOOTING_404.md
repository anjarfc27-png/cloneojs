# Troubleshooting 404 Error untuk Demo Tenants

## 🐛 Problem: 404 Error pada `/demo-a`, `/demo-b`, `/demo-c`

### Penyebab Umum

1. **Demo tenants belum dibuat di database**
   - Tenants dengan slug `demo-a`, `demo-b`, `demo-c` belum ada
   - Journals belum dibuat untuk tenants tersebut

2. **Query Error di Supabase**
   - Supabase client tidak terkonfigurasi dengan benar
   - Environment variables tidak di-set
   - RLS policies menghalangi query

3. **Journal tidak aktif**
   - Journal `is_active = false`
   - Tenant `is_active = false`

## 🔍 Langkah Troubleshooting

### 1. Verifikasi Database

Jalankan query berikut di Supabase Dashboard > SQL Editor:

```sql
-- Cek apakah tenants sudah ada
SELECT id, name, slug, is_active 
FROM tenants 
WHERE slug IN ('demo-a', 'demo-b', 'demo-c');

-- Cek apakah journals sudah ada
SELECT 
  t.slug as tenant_slug,
  j.id as journal_id,
  j.title as journal_title,
  j.is_active as journal_active
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c');
```

### 2. Setup Demo Tenants

Jika tenants belum ada, jalankan script seed:

**Option 1: Menggunakan Halaman Seed**
1. Akses: `http://localhost:3000/debug/seed-journals`
2. Copy SQL script
3. Jalankan di Supabase Dashboard > SQL Editor

**Option 2: Jalankan SQL Langsung**

```sql
-- Seed 3 tenants, journals, dan satu issue per jurnal
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
```

### 3. Verifikasi Environment Variables

Pastikan file `.env.local` sudah di-set dengan benar:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Cek Console Logs

Buka browser console dan cek error messages:
- Error dari Supabase client
- Error dari query
- Error dari RLS policies

### 5. Test Query Langsung

Test query di browser console atau menggunakan API:

```javascript
// Test di browser console (setelah login)
const response = await fetch('/api/debug/tenant-users');
const data = await response.json();
console.log('Tenants:', data);
```

### 6. Cek RLS Policies

Pastikan RLS policies mengizinkan akses public untuk membaca tenants dan journals:

```sql
-- Cek RLS policies untuk tenants
SELECT * FROM pg_policies WHERE tablename = 'tenants';

-- Cek RLS policies untuk journals
SELECT * FROM pg_policies WHERE tablename = 'journals';
```

Jika perlu, tambahkan policy untuk public access:

```sql
-- Allow public to read active tenants
CREATE POLICY "Public can view active tenants" ON tenants
  FOR SELECT USING (is_active = true);

-- Allow public to read active journals
CREATE POLICY "Public can view active journals" ON journals
  FOR SELECT USING (is_active = true);
```

## ✅ Checklist

- [ ] Demo tenants sudah dibuat di database
- [ ] Journals sudah dibuat untuk setiap tenant
- [ ] Environment variables sudah di-set
- [ ] Supabase client terkonfigurasi dengan benar
- [ ] RLS policies mengizinkan public access
- [ ] Journal `is_active = true`
- [ ] Tenant `is_active = true`
- [ ] Tidak ada error di console
- [ ] Query berhasil di Supabase Dashboard

## 🔧 Quick Fix

Jika semua sudah di-setup tapi masih 404:

1. **Restart development server**:
   ```bash
   npm run dev
   ```

2. **Clear browser cache**:
   - Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

3. **Cek network tab**:
   - Buka DevTools > Network
   - Lihat request ke `/demo-a`
   - Cek response status dan error messages

4. **Test dengan journal ID langsung**:
   - Ambil journal ID dari database
   - Akses: `http://localhost:3000/{journal-id}`
   - Jika berhasil, masalahnya di query tenant slug

## 📝 Debug Mode

Tambahkan logging di `app/[journalSlug]/page.tsx`:

```typescript
console.log('Journal slug:', params.journalSlug);
console.log('Tenant query result:', tenant);
console.log('Journal query result:', journal);
```

Ini akan membantu melihat di mana query gagal.

## 🆘 Still Not Working?

Jika masih error setelah semua langkah di atas:

1. Cek error logs di Supabase Dashboard > Logs
2. Cek Next.js server logs di terminal
3. Pastikan schema database sudah dijalankan (`schema.sql` dan `schema-extensions.sql`)
4. Verifikasi bahwa tabel `tenants` dan `journals` sudah ada
5. Cek apakah ada conflict dengan route lain (misalnya route `/admin`)



