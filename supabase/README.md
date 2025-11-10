# Supabase Database Setup

## Schema Overview

Database schema untuk OJS Multi-Tenant system menggunakan PostgreSQL di Supabase.

## Tables

### Core Tables
- `tenants` - Organisasi/jurnal publisher
- `tenant_users` - Relasi user dengan tenant (multi-tenant)
- `journals` - Jurnal dalam tenant
- `sections` - Kategori/section dalam jurnal

### Submission Tables
- `submissions` - Artikel yang di-submit
- `submission_authors` - Author dari submission
- `submission_files` - File-file submission

### Review Tables
- `review_assignments` - Assignment reviewer
- `review_files` - File yang dibagikan ke reviewer

### Editorial Tables
- `editorial_decisions` - Keputusan editor

### Publishing Tables
- `articles` - Artikel yang sudah dipublish
- `article_authors` - Author artikel published
- `article_files` - File artikel published

## Setup Instructions

1. Buka Supabase Dashboard
2. Pilih project Anda
3. Buka SQL Editor
4. Copy seluruh isi `schema.sql`
5. Paste dan jalankan di SQL Editor
6. Pastikan semua tabel dan policies sudah dibuat

## Row Level Security (RLS)

Semua tabel menggunakan RLS untuk keamanan. Policies dasar sudah disertakan, namun Anda mungkin perlu menyesuaikan sesuai kebutuhan spesifik.

## Indexes

Indexes sudah dibuat untuk:
- Foreign keys
- Status fields
- Date fields
- User/tenant lookups

## Enums

- `user_role_type` - Role user
- `submission_status` - Status submission
- `review_status` - Status review
- `review_recommendation` - Rekomendasi reviewer
- `decision_type` - Tipe keputusan editor

