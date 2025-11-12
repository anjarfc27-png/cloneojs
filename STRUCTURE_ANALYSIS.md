# Analisis Struktur Aplikasi OJS Multi-Tenant

## 📋 Overview

Aplikasi ini menggunakan Next.js 14 App Router dengan struktur multi-tenant. Setiap tenant dapat memiliki satu atau lebih journal, dan diakses melalui URL slug.

## 🗂️ Struktur Routing

### Public Routes

#### 1. Root Route
- **Path**: `/`
- **File**: `app/page.tsx`
- **Function**: Homepage, redirect ke dashboard jika user sudah login

#### 2. Journal Routes (Dynamic)
- **Path**: `/[journalSlug]`
- **File**: `app/[journalSlug]/page.tsx`
- **Function**: Halaman utama journal
- **Parameter**: `journalSlug` bisa berupa:
  - UUID journal ID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
  - Tenant slug (contoh: `demo-a`, `demo-b`, `demo-c`)

#### 3. Journal Issues
- **Path**: `/[journalSlug]/issues`
- **File**: `app/[journalSlug]/issues/page.tsx`
- **Function**: Daftar semua issues journal

#### 4. Journal Issue Detail
- **Path**: `/[journalSlug]/issue/[issueId]`
- **File**: `app/[journalSlug]/issue/[issueId]/page.tsx`
- **Function**: Detail issue tertentu

#### 5. Article Detail
- **Path**: `/article/[id]`
- **File**: `app/article/[id]/page.tsx`
- **Function**: Detail artikel yang sudah dipublish

### Protected Routes (Dashboard)

#### 1. Dashboard Home
- **Path**: `/dashboard`
- **File**: `app/dashboard/page.tsx`
- **Auth**: Required

#### 2. Dashboard Submissions
- **Path**: `/dashboard/submissions`
- **File**: `app/dashboard/submissions/page.tsx`
- **Auth**: Required

#### 3. Dashboard Issues
- **Path**: `/dashboard/issues`
- **File**: `app/dashboard/issues/page.tsx`
- **Auth**: Required

#### 4. Dashboard Journals
- **Path**: `/dashboard/journals`
- **File**: `app/dashboard/journals/page.tsx`
- **Auth**: Required

### Admin Routes

#### 1. Admin Dashboard
- **Path**: `/admin/dashboard`
- **File**: `app/admin/dashboard/page.tsx`
- **Auth**: Super Admin only

#### 2. Admin Journals
- **Path**: `/admin/journals`
- **File**: `app/admin/journals/page.tsx`
- **Auth**: Super Admin only

#### 3. Admin Users
- **Path**: `/admin/users`
- **File**: `app/admin/users/page.tsx`
- **Auth**: Super Admin only

## 🏗️ Database Structure

### Core Tables

#### 1. `tenants`
- **Purpose**: Organisasi/publisher
- **Key Fields**: `id`, `name`, `slug`, `is_active`
- **Relationships**: 
  - One-to-Many dengan `journals`
  - One-to-Many dengan `tenant_users`

#### 2. `journals`
- **Purpose**: Jurnal dalam tenant
- **Key Fields**: `id`, `tenant_id`, `title`, `description`, `is_active`
- **Relationships**:
  - Many-to-One dengan `tenants`
  - One-to-Many dengan `sections`
  - One-to-Many dengan `submissions`
  - One-to-Many dengan `articles`
  - One-to-Many dengan `issues`

#### 3. `tenant_users`
- **Purpose**: Relasi user dengan tenant (multi-tenant)
- **Key Fields**: `user_id`, `tenant_id`, `role`, `is_active`
- **Roles**: `super_admin`, `editor`, `section_editor`, `reviewer`, `author`, `reader`

#### 4. `issues`
- **Purpose**: Issue journal
- **Key Fields**: `id`, `journal_id`, `volume`, `number`, `year`, `is_published`
- **Relationships**: Many-to-One dengan `journals`

#### 5. `articles`
- **Purpose**: Artikel yang sudah dipublish
- **Key Fields**: `id`, `journal_id`, `issue_id`, `title`, `published_date`
- **Relationships**: Many-to-One dengan `journals`, Many-to-One dengan `issues`

## 🔄 Routing Logic

### Journal Slug Resolution

File: `app/[journalSlug]/page.tsx`

```typescript
// 1. Cek apakah journalSlug adalah UUID
if (journalSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
  // Query journal by ID
} else {
  // Query tenant by slug, kemudian ambil journal pertama dari tenant tersebut
}
```

### Demo Tenants

Terdapat 3 demo tenants:
1. **demo-a**: Journal of Computer Science
2. **demo-b**: Journal of Medical Research  
3. **demo-c**: Journal of Environmental Studies

URL akses:
- `http://localhost:3000/demo-a`
- `http://localhost:3000/demo-b`
- `http://localhost:3000/demo-c`

## 🔍 Issues yang Ditemukan

### 1. JournalHeader Navigation Links

**File**: `components/journal/JournalHeader.tsx`

**Problem**: Link menggunakan `/journal/${journal.id}` padahal seharusnya menggunakan slug

**Current**:
```typescript
<Link href={`/journal/${journal.id}`}>Beranda</Link>
<Link href={`/journal/${journal.id}/about`}>Tentang</Link>
<Link href={`/journal/${journal.id}/issues`}>Issues</Link>
```

**Expected**:
```typescript
// Gunakan tenant slug atau journal slug
<Link href={`/${journal.tenants?.slug || journal.id}`}>Beranda</Link>
<Link href={`/${journal.tenants?.slug || journal.id}/issues`}>Issues</Link>
```

### 2. JournalSidebar Links

**File**: `components/journal/JournalSidebar.tsx`

**Problem**: Link menggunakan `/journal/${journal.id}/section/...` padahal route tersebut tidak ada

**Current**:
```typescript
<Link href={`/journal/${journal.id}/section/${section.id}`}>
```

**Expected**: Perlu dibuat route untuk sections atau gunakan filter di halaman journal

### 3. CurrentIssue Links

**File**: `components/journal/CurrentIssue.tsx`

**Status**: ✅ Sudah benar menggunakan `journalSlug` dari props

## 📝 Recommendations

### 1. Fix Navigation Links

Update `JournalHeader.tsx` untuk menggunakan tenant slug:
- Jika journal memiliki tenant, gunakan tenant slug
- Jika tidak, gunakan journal ID

### 2. Create Section Routes (Optional)

Jika perlu, buat route untuk sections:
- `/[journalSlug]/section/[sectionId]`

### 3. Add Metadata/SEO

Tambahkan metadata untuk setiap halaman journal:
- Title: Journal name
- Description: Journal description
- Open Graph tags

### 4. Error Handling

Tambahkan error handling yang lebih baik:
- Handle case ketika tenant tidak ditemukan
- Handle case ketika journal tidak aktif
- Handle case ketika tidak ada journal di tenant

## 🧪 Testing Checklist

### Demo Tenants

- [ ] `/demo-a` - Journal of Computer Science
- [ ] `/demo-b` - Journal of Medical Research
- [ ] `/demo-c` - Journal of Environmental Studies

### Functionality

- [ ] Journal homepage loads correctly
- [ ] Issues page loads correctly
- [ ] Issue detail page loads correctly
- [ ] Articles display correctly
- [ ] Navigation links work correctly
- [ ] Sidebar displays correctly
- [ ] Current issue displays correctly (if exists)

### Error Cases

- [ ] Non-existent tenant slug returns 404
- [ ] Non-existent journal ID returns 404
- [ ] Inactive journal doesn't display
- [ ] Empty journal (no articles/issues) displays correctly

## 📚 Related Files

### Routing Files
- `app/[journalSlug]/page.tsx` - Journal homepage
- `app/[journalSlug]/issues/page.tsx` - Issues list
- `app/[journalSlug]/issue/[issueId]/page.tsx` - Issue detail

### Components
- `components/journal/JournalHeader.tsx` - Journal header
- `components/journal/JournalSidebar.tsx` - Journal sidebar
- `components/journal/LatestArticles.tsx` - Latest articles list
- `components/journal/CurrentIssue.tsx` - Current issue card

### Database
- `supabase/schema.sql` - Main schema
- `supabase/schema-extensions.sql` - Extensions (issues, volumes, etc.)

### Seed Data
- `app/debug/seed-journals/page.tsx` - Seed script for demo tenants



