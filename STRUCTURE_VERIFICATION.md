# Verifikasi Struktur Aplikasi - Demo Tenants

## ✅ Perubahan yang Telah Dilakukan

### 1. Fixed Navigation Links

**File**: `components/journal/JournalHeader.tsx`
- ✅ Menambahkan prop `journalSlug` untuk navigation
- ✅ Menggunakan tenant slug atau journal slug untuk links
- ✅ Links sekarang menggunakan format `/{journalSlug}` bukan `/journal/{id}`
- ✅ Menghapus link "Tentang" yang tidak memiliki route

**File**: `components/journal/JournalSidebar.tsx`
- ✅ Menambahkan prop `journalSlug` untuk navigation
- ✅ Menghapus links ke sections yang tidak memiliki route
- ✅ Sections sekarang hanya ditampilkan sebagai list tanpa links

### 2. Updated Page Components

**File**: `app/[journalSlug]/page.tsx`
- ✅ Pass `journalSlug` ke `JournalHeader` dan `JournalSidebar`

**File**: `app/[journalSlug]/issues/page.tsx`
- ✅ Pass `journalSlug` ke `JournalHeader` dan `JournalSidebar`

**File**: `app/[journalSlug]/issue/[issueId]/page.tsx`
- ✅ Pass `journalSlug` ke `JournalHeader` dan `JournalSidebar`

## 🧪 Testing Checklist

### 1. Verifikasi Database

Jalankan script SQL di `supabase/verify-demo-tenants.sql` untuk mengecek:

```sql
-- Cek apakah demo tenants sudah ada
SELECT * FROM tenants WHERE slug IN ('demo-a', 'demo-b', 'demo-c');

-- Cek apakah journals sudah ada
SELECT t.slug, j.title 
FROM tenants t 
LEFT JOIN journals j ON j.tenant_id = t.id 
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c');

-- Cek apakah issues sudah ada
SELECT t.slug, j.title, COUNT(i.id) as issue_count
FROM tenants t
LEFT JOIN journals j ON j.tenant_id = t.id
LEFT JOIN issues i ON i.journal_id = j.id
WHERE t.slug IN ('demo-a', 'demo-b', 'demo-c')
GROUP BY t.slug, j.title;
```

### 2. Test URLs

#### Demo A - Journal of Computer Science
- [ ] `http://localhost:3000/demo-a` - Homepage
- [ ] `http://localhost:3000/demo-a/issues` - Issues list
- [ ] `http://localhost:3000/demo-a/issue/{issueId}` - Issue detail

#### Demo B - Journal of Medical Research
- [ ] `http://localhost:3000/demo-b` - Homepage
- [ ] `http://localhost:3000/demo-b/issues` - Issues list
- [ ] `http://localhost:3000/demo-b/issue/{issueId}` - Issue detail

#### Demo C - Journal of Environmental Studies
- [ ] `http://localhost:3000/demo-c` - Homepage
- [ ] `http://localhost:3000/demo-c/issues` - Issues list
- [ ] `http://localhost:3000/demo-c/issue/{issueId}` - Issue detail

### 3. Test Navigation

#### Journal Header Navigation
- [ ] Link "Beranda" mengarah ke `/{journalSlug}`
- [ ] Link "Issues" mengarah ke `/{journalSlug}/issues`
- [ ] Link "Dashboard" mengarah ke `/dashboard` (jika user logged in)
- [ ] Link "Masuk" mengarah ke `/login` (jika user not logged in)
- [ ] Link "Daftar" mengarah ke `/register` (jika user not logged in)

#### Current Issue Navigation
- [ ] Link "Lihat Issue Ini" mengarah ke `/{journalSlug}/issue/{issueId}`
- [ ] Link "Lihat Semua Issues" mengarah ke `/{journalSlug}/issues`

#### Issues Page Navigation
- [ ] Link "Lihat Issue →" mengarah ke `/{journalSlug}/issue/{issueId}`

### 4. Test Functionality

#### Journal Homepage (`/{journalSlug}`)
- [ ] Journal header menampilkan title dan logo
- [ ] Journal description ditampilkan
- [ ] Current issue ditampilkan (jika ada)
- [ ] Latest articles ditampilkan (jika ada)
- [ ] Sidebar menampilkan sections (jika ada)
- [ ] Sidebar menampilkan journal info (ISSN, e-ISSN)
- [ ] Sidebar menampilkan "Submit Article" card

#### Issues Page (`/{journalSlug}/issues`)
- [ ] Daftar semua published issues ditampilkan
- [ ] Issues dikelompokkan berdasarkan tahun
- [ ] Setiap issue menampilkan cover image (jika ada)
- [ ] Setiap issue menampilkan title, description, published date
- [ ] Setiap issue menampilkan jumlah artikel
- [ ] Link ke issue detail bekerja

#### Issue Detail Page (`/{journalSlug}/issue/{issueId}`)
- [ ] Issue header menampilkan cover image, title, description
- [ ] Articles dikelompokkan berdasarkan section
- [ ] Setiap article menampilkan title, authors, abstract
- [ ] Link ke article detail bekerja
- [ ] Navigation previous/next issue bekerja (jika ada)

### 5. Test Error Cases

- [ ] Non-existent tenant slug (`/demo-x`) returns 404
- [ ] Non-existent journal ID returns 404
- [ ] Non-existent issue ID returns 404
- [ ] Inactive journal doesn't display
- [ ] Empty journal (no articles/issues) displays correctly
- [ ] Journal tanpa current issue tidak error
- [ ] Journal tanpa articles tidak error

## 📝 Setup Instructions

### 1. Setup Database Schema

```bash
# Jalankan di Supabase Dashboard > SQL Editor
# 1. Jalankan schema.sql
# 2. Jalankan schema-extensions.sql
```

### 2. Seed Demo Tenants

```bash
# Option 1: Gunakan halaman seed
# Akses: http://localhost:3000/debug/seed-journals
# Copy SQL script dan jalankan di Supabase Dashboard > SQL Editor

# Option 2: Jalankan SQL langsung
# Copy script dari app/debug/seed-journals/page.tsx
# Jalankan di Supabase Dashboard > SQL Editor
```

### 3. Verify Setup

```bash
# Jalankan script verify-demo-tenants.sql
# Di Supabase Dashboard > SQL Editor
```

### 4. Test URLs

```bash
# Start development server
npm run dev

# Test URLs:
# http://localhost:3000/demo-a
# http://localhost:3000/demo-b
# http://localhost:3000/demo-c
```

## 🔍 Troubleshooting

### Problem: 404 Not Found

**Penyebab**: Tenant atau journal tidak ditemukan

**Solusi**:
1. Cek apakah tenant sudah ada di database
2. Cek apakah journal sudah ada untuk tenant tersebut
3. Cek apakah journal `is_active = true`
4. Jalankan script verify-demo-tenants.sql untuk debugging

### Problem: Navigation Links Tidak Bekerja

**Penyebab**: Links menggunakan format lama `/journal/{id}`

**Solusi**: 
- Pastikan sudah update ke versi terbaru
- Pastikan `journalSlug` di-pass ke components
- Clear browser cache

### Problem: Current Issue Tidak Tampil

**Penyebab**: Tidak ada published issue

**Solusi**:
1. Cek apakah issue sudah dibuat
2. Cek apakah issue `is_published = true`
3. Cek apakah issue memiliki `published_date`

### Problem: Articles Tidak Tampil

**Penyebab**: Tidak ada published articles

**Solusi**:
1. Cek apakah articles sudah dibuat
2. Cek apakah articles memiliki `published_date`
3. Cek apakah articles terkait dengan journal yang benar

## 📚 Related Files

### Routing
- `app/[journalSlug]/page.tsx` - Journal homepage
- `app/[journalSlug]/issues/page.tsx` - Issues list
- `app/[journalSlug]/issue/[issueId]/page.tsx` - Issue detail

### Components
- `components/journal/JournalHeader.tsx` - Journal header with navigation
- `components/journal/JournalSidebar.tsx` - Journal sidebar
- `components/journal/LatestArticles.tsx` - Latest articles list
- `components/journal/CurrentIssue.tsx` - Current issue card

### Database
- `supabase/schema.sql` - Main schema
- `supabase/schema-extensions.sql` - Extensions (issues, volumes, etc.)
- `supabase/verify-demo-tenants.sql` - Verification script

### Seed Data
- `app/debug/seed-journals/page.tsx` - Seed script for demo tenants

## ✅ Summary

### Struktur Routing
- ✅ Dynamic routing menggunakan `[journalSlug]`
- ✅ Support UUID journal ID dan tenant slug
- ✅ Navigation links menggunakan slug konsisten
- ✅ All pages pass `journalSlug` ke components

### Components
- ✅ JournalHeader menggunakan `journalSlug` untuk navigation
- ✅ JournalSidebar menggunakan `journalSlug` untuk navigation
- ✅ CurrentIssue menggunakan `journalSlug` untuk navigation
- ✅ All links konsisten menggunakan slug format

### Database
- ✅ Schema sudah lengkap
- ✅ Demo tenants bisa di-seed
- ✅ Verification script tersedia

### Testing
- ✅ Checklist tersedia
- ✅ Troubleshooting guide tersedia
- ✅ Setup instructions lengkap



