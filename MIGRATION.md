# Panduan Migrasi Data dari OJS ke Next.js OJS

Dokumentasi lengkap untuk migrasi data dari OJS PKP (MySQL/PostgreSQL) ke sistem Next.js dengan Supabase.

## Daftar Isi

1. [Persiapan](#persiapan)
2. [Setup Environment](#setup-environment)
3. [Migrasi Database](#migrasi-database)
4. [Migrasi File ke Google Drive](#migrasi-file-ke-google-drive)
5. [Verifikasi Data](#verifikasi-data)
6. [Troubleshooting](#troubleshooting)

## Persiapan

### Prerequisites

- Akses ke database OJS (MySQL atau PostgreSQL)
- Akun Supabase dengan project yang sudah dibuat
- Google Drive API credentials (untuk file migration)
- Node.js 18+ terinstall

### Backup Database OJS

**PENTING:** Selalu backup database OJS sebelum migrasi!

```bash
# MySQL
mysqldump -u root -p ojs_database > ojs_backup.sql

# PostgreSQL
pg_dump -U postgres ojs_database > ojs_backup.sql
```

## Setup Environment

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Source Database (MySQL)
SOURCE_DB_TYPE=mysql
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=3306
SOURCE_DB_NAME=ojs_database
SOURCE_DB_USER=root
SOURCE_DB_PASSWORD=your_password

# Atau PostgreSQL
SOURCE_DB_TYPE=postgres
SOURCE_DB_HOST=localhost
SOURCE_DB_PORT=5432
SOURCE_DB_NAME=ojs_database
SOURCE_DB_USER=postgres
SOURCE_DB_PASSWORD=your_password

# Google Drive (untuk file migration)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

## Migrasi Database

### Step 1: Setup Supabase Schema

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan `supabase/schema.sql` (schema dasar)
3. Jalankan `supabase/schema-extensions.sql` (extensions untuk Issue, Volume, ORCID, dll)

### Step 2: Jalankan Migration Script

```bash
# Migrasi dari MySQL
npm run migrate -- \
  --source=mysql \
  --host=localhost \
  --database=ojs_database \
  --user=root \
  --password=your_password \
  --supabaseUrl=your_supabase_url \
  --supabaseKey=your_service_role_key

# Migrasi dari PostgreSQL
npm run migrate -- \
  --source=postgres \
  --host=localhost \
  --database=ojs_database \
  --user=postgres \
  --password=your_password \
  --supabaseUrl=your_supabase_url \
  --supabaseKey=your_service_role_key
```

### Step 3: Mapping Data

Script migration akan melakukan mapping:

| OJS Table | Supabase Table | Notes |
|----------|---------------|-------|
| `users` | `auth.users` + `user_profiles` | Password perlu di-reset (OJS menggunakan bcrypt) |
| `journals` | `journals` | Settings disimpan di JSONB |
| `submissions` | `submissions` | Status di-transform |
| `review_assignments` | `review_assignments` | |
| `published_submissions` | `articles` | |
| `issues` | `issues` | |
| `custom_issue_orders` | `volumes` | |

### Step 4: Transformasi Data

#### Submission Status Mapping

```typescript
OJS Status → New Status
1 (INCOMPLETE) → 'draft'
3 (QUEUED) → 'submitted'
4 (SUBMISSION) → 'submitted'
5 (REVIEW) → 'under_review'
6 (ACCEPTED) → 'accepted'
7 (DECLINED) → 'declined'
8 (PUBLISHED) → 'published'
```

#### User Roles Mapping

```typescript
OJS Role → New Role
'Manager' → 'super_admin'
'Editor' → 'editor'
'Section Editor' → 'section_editor'
'Reviewer' → 'reviewer'
'Author' → 'author'
'Reader' → 'reader'
```

## Migrasi File ke Google Drive

### Step 1: Setup Google Drive API

1. Buat project di [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Generate refresh token

### Step 2: Upload Files

Script migration akan:
1. Scan folder `files/articles` di OJS
2. Upload setiap file ke Google Drive
3. Simpan `webViewLink` di database
4. Map file ID ke `google_drive_files` table

```bash
npm run migrate:files -- \
  --ojsFilesPath=/path/to/ojs/files \
  --googleDriveFolderId=your_folder_id
```

### Step 3: File Mapping

File mapping disimpan di tabel `google_drive_files`:
- `file_id`: Google Drive file ID
- `web_view_link`: Link untuk embed/view
- `web_content_link`: Link untuk download
- `submission_file_id` atau `article_file_id`: Link ke submission/article

## Verifikasi Data

### Checklist Verifikasi

- [ ] Semua users ter-migrasi
- [ ] Semua journals ter-migrasi
- [ ] Semua submissions ter-migrasi dengan status yang benar
- [ ] Semua reviews ter-migrasi
- [ ] Semua published articles ter-migrasi
- [ ] Semua issues ter-migrasi
- [ ] Semua files ter-upload ke Google Drive
- [ ] ORCID IDs ter-migrasi
- [ ] DOI registrations ter-migrasi
- [ ] Plugin settings ter-migrasi

### Query Verifikasi

```sql
-- Check user count
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM user_profiles;

-- Check journal count
SELECT COUNT(*) FROM journals;

-- Check submission count by status
SELECT status, COUNT(*) 
FROM submissions 
GROUP BY status;

-- Check published articles
SELECT COUNT(*) FROM articles WHERE published_date IS NOT NULL;

-- Check Google Drive files
SELECT COUNT(*) FROM google_drive_files;
```

## Troubleshooting

### Error: "User already exists"

OJS users mungkin sudah ada di Supabase. Script akan skip user yang sudah ada.

**Solusi:** Hapus user dari Supabase atau gunakan `--skipExistingUsers` flag.

### Error: "Foreign key constraint"

Pastikan urutan migrasi benar:
1. Users
2. Tenants
3. Journals
4. Sections
5. Submissions
6. Reviews
7. Articles
8. Issues

### Error: "Google Drive upload failed"

- Cek Google Drive API credentials
- Pastikan folder ID valid
- Cek quota Google Drive

### Password tidak bisa login

OJS menggunakan bcrypt dengan salt khusus. User perlu reset password setelah migrasi.

**Solusi:** Kirim email reset password ke semua user atau buat script untuk reset massal.

### File tidak ter-embed

Pastikan:
- Google Drive file permission sudah di-set ke "Anyone with link can view"
- `webViewLink` sudah benar
- File format PDF

## Post-Migration

### 1. Reset User Passwords

```sql
-- Generate reset password links untuk semua user
-- (Implementasi di aplikasi)
```

### 2. Update File Permissions

```typescript
// Script untuk update Google Drive permissions
import { shareFile } from '@/lib/google-drive'

// Set semua file ke "Anyone with link can view"
```

### 3. Test Workflow

- [ ] User bisa login
- [ ] Author bisa submit
- [ ] Editor bisa assign reviewer
- [ ] Reviewer bisa review
- [ ] Article bisa dipublish
- [ ] Public bisa view article
- [ ] PDF bisa di-view via Google Drive

## Support

Jika ada masalah selama migrasi:
1. Cek log migration script
2. Verifikasi database connection
3. Cek Supabase logs
4. Buat issue di repository

