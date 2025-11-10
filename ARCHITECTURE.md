# Arsitektur Sistem OJS Next.js

Dokumentasi arsitektur lengkap untuk sistem OJS yang dibangun dengan Next.js fullstack.

## Overview

Sistem ini adalah reimplementasi OJS PKP menggunakan:
- **Frontend & Backend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Google Drive (via webViewLink)
- **Deployment**: Vercel

## Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Public     │  │   Author     │  │   Editor     │  │
│  │   Reader     │  │   Dashboard  │  │   Dashboard  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Application (Vercel)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │           App Router (Server Components)          │  │
│  │  - / (public pages)                              │  │
│  │  - /dashboard (protected)                        │  │
│  │  - /api (API routes)                             │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Middleware Layer                     │  │
│  │  - Authentication check                          │  │
│  │  - Session management                             │  │
│  │  - Role-based access control                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
┌──────────────────┐              ┌──────────────────┐
│    Supabase      │              │   Google Drive    │
│  ┌────────────┐  │              │  ┌────────────┐  │
│  │ PostgreSQL │  │              │  │ File Store │  │
│  │  Database  │  │              │  │  (PDFs)    │  │
│  └────────────┘  │              │  └────────────┘  │
│  ┌────────────┐  │              │  ┌────────────┐  │
│  │    Auth    │  │              │  │  API       │  │
│  │  (JWT)     │  │              │  │  Access    │  │
│  └────────────┘  │              │  └────────────┘  │
│  ┌────────────┐  │              └──────────────────┘
│  │    RLS     │  │
│  │  Policies  │  │
│  └────────────┘  │
└──────────────────┘
```

## Database Schema (Supabase)

### Core Tables

#### Multi-Tenant Architecture
- `tenants` - Organisasi/publisher
- `tenant_users` - User-tenant relationship dengan roles
- `journals` - Jurnal dalam tenant
- `sections` - Kategori artikel

#### Submission Workflow
- `submissions` - Artikel yang di-submit
- `submission_authors` - Author dari submission
- `submission_files` - File submission (link ke Google Drive)

#### Peer Review
- `review_assignments` - Assignment reviewer
- `review_files` - File yang dibagikan ke reviewer

#### Publishing
- `articles` - Artikel yang sudah dipublish
- `article_authors` - Author artikel
- `article_files` - File artikel (link ke Google Drive)
- `issues` - Issue jurnal
- `volumes` - Volume jurnal

#### Extensions
- `user_profiles` - Extended user metadata (ORCID, dll)
- `google_drive_files` - Mapping file ke Google Drive
- `doi_registrations` - DOI management
- `publication_history` - Tracking perubahan publikasi
- `plugin_settings` - Plugin compatibility
- `citation_metadata` - Citation tracking

### Relationships

```
tenants (1) ──→ (N) journals
journals (1) ──→ (N) sections
journals (1) ──→ (N) submissions
submissions (1) ──→ (N) submission_authors
submissions (1) ──→ (N) submission_files
submission_files (1) ──→ (1) google_drive_files
submissions (1) ──→ (N) review_assignments
submissions (1) ──→ (1) articles
articles (1) ──→ (N) article_authors
articles (1) ──→ (N) article_files
article_files (1) ──→ (1) google_drive_files
articles (N) ──→ (1) issues
issues (N) ──→ (1) journals
```

## API Routes (Next.js)

### Public Routes
- `GET /` - Homepage
- `GET /journal/:slug` - Journal homepage
- `GET /article/:id` - View article
- `GET /issue/:id` - View issue

### Protected Routes (Dashboard)
- `GET /dashboard` - Dashboard
- `GET /dashboard/submissions` - List submissions
- `POST /dashboard/submissions` - Create submission
- `GET /dashboard/submissions/:id` - View submission
- `GET /dashboard/reviews` - List reviews
- `GET /dashboard/articles` - List articles

### API Endpoints
- `POST /api/google-drive/upload` - Upload file ke Google Drive
- `GET /api/articles/:id` - Get article data
- `POST /api/submissions/:id/submit` - Submit artikel
- `POST /api/reviews/:id/complete` - Complete review

## Authentication & Authorization

### Authentication Flow

1. User login via Supabase Auth
2. JWT token disimpan di cookie (httpOnly)
3. Middleware check token di setiap request
4. User data di-fetch dari Supabase

### Role-Based Access Control (RBAC)

Roles:
- `super_admin` - Full access
- `editor` - Manage journal, assign reviewers
- `section_editor` - Manage section
- `reviewer` - Review submissions
- `author` - Submit articles
- `reader` - Read published articles

### Row Level Security (RLS)

Supabase RLS policies:
- Users hanya bisa akses data tenant mereka
- Authors hanya bisa lihat submission mereka
- Editors bisa akses semua submission di journal mereka
- Reviewers hanya bisa akses review assignment mereka
- Published articles bisa diakses semua authenticated users

## File Storage Strategy

### Google Drive Integration

1. **Upload Flow**:
   - User upload file via form
   - File dikirim ke `/api/google-drive/upload`
   - File di-upload ke Google Drive
   - `webViewLink` disimpan di database
   - File ID di-link ke `submission_files` atau `article_files`

2. **View Flow**:
   - Frontend request file metadata
   - System return `webViewLink`
   - PDF di-embed menggunakan Google Drive viewer:
     ```html
     <iframe src="https://drive.google.com/file/d/{fileId}/preview"></iframe>
     ```

3. **Permissions**:
   - File di-set ke "Anyone with link can view"
   - Tidak perlu authentication untuk view
   - Download bisa di-restrict jika perlu

## Data Transformation (Migration)

### OJS → Supabase Mapping

| OJS Concept | Supabase Implementation |
|------------|------------------------|
| `users` table | `auth.users` + `user_profiles` |
| `journals` table | `journals` (dengan `tenant_id`) |
| `submissions` table | `submissions` (status di-transform) |
| `files/articles/` | Google Drive (via `webViewLink`) |
| `issues` table | `issues` |
| `custom_issue_orders` | `volumes` |

### Status Transformation

```typescript
function transformOJSStatus(ojsStatus: number): string {
  const map = {
    1: 'draft',      // INCOMPLETE
    3: 'submitted',  // QUEUED
    4: 'submitted',  // SUBMISSION
    5: 'under_review', // REVIEW
    6: 'accepted',   // ACCEPTED
    7: 'declined',   // DECLINED
    8: 'published',  // PUBLISHED
  }
  return map[ojsStatus] || 'draft'
}
```

## Security Considerations

### 1. Authentication
- JWT tokens di httpOnly cookies
- Token refresh otomatis
- Session timeout

### 2. Authorization
- RLS policies di Supabase
- Role checks di middleware
- API route protection

### 3. Data Privacy
- User data ter-isolasi per tenant
- File permissions di Google Drive
- Audit logs untuk sensitive operations

### 4. API Security
- Rate limiting (via Vercel)
- Input validation
- SQL injection prevention (Supabase handles)

## Performance Optimization

### 1. Database
- Indexes pada foreign keys
- Indexes pada status fields
- Connection pooling (Supabase)

### 2. Caching
- Static pages di-cache (Vercel)
- API responses di-cache jika memungkinkan
- Google Drive links di-cache

### 3. File Loading
- Lazy loading untuk PDF viewer
- Thumbnail untuk preview
- Progressive loading

## Deployment (Vercel)

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
```

### Build Process

1. `npm run build` - Build Next.js app
2. Vercel deploy otomatis dari Git
3. Environment variables di-set di Vercel dashboard

## Compliance dengan GPL

### License
- Sistem ini menggunakan GPL v3.0 (sama dengan OJS)
- Semua code harus open source
- Modifications harus di-share kembali

### Attribution
- Credit ke PKP untuk OJS original
- License notice di setiap file
- README menyebutkan OJS sebagai inspiration

## Monitoring & Logging

### Supabase
- Database logs
- Auth logs
- API usage metrics

### Vercel
- Function logs
- Performance metrics
- Error tracking

### Custom
- Publication history (audit trail)
- User activity logs (optional)

## Future Enhancements

1. **Real-time Updates**: WebSocket untuk notification
2. **Search**: Full-text search dengan PostgreSQL
3. **Analytics**: Article views, downloads tracking
4. **Email Notifications**: Via Supabase functions
5. **Multi-language**: i18n support
6. **Themes**: Customizable UI themes
7. **Plugins**: Plugin system seperti OJS

