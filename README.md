# OJS Next.js Clone - Functional Reimplementation

Klon OJS (Open Journal Systems) yang fungsional dan identik dengan OJS PKP, diimplementasikan ulang menggunakan **Next.js fullstack** dan **Supabase**.

## 🎯 Tujuan

Membangun sistem OJS yang:
- ✅ **Identik 100%** pada UI/UX dan perilaku dengan OJS PKP
- ✅ Menggunakan **Next.js 14 (App Router)** untuk frontend & backend
- ✅ **Supabase** sebagai database dan authentication
- ✅ File PDF diakses via **Google Drive webViewLink**
- ✅ Support **import/migrasi data** dari OJS (MySQL/Postgres)
- ✅ Compliance dengan **GPL v3.0** license

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router) - Fullstack
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Google Drive API
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## ✨ Fitur Utama

### Core Features
- ✅ Multi-tenant architecture (multiple journals)
- ✅ Role-based access control (Super Admin, Editor, Section Editor, Reviewer, Author, Reader)
- ✅ Complete submission workflow
- ✅ Peer review system dengan multiple rounds
- ✅ Publishing system dengan Issue & Volume management
- ✅ Article management dengan DOI & ORCID support
- ✅ Google Drive integration untuk file storage
- ✅ Data migration dari OJS MySQL/Postgres

### Advanced Features
- ✅ ORCID integration
- ✅ DOI registration support
- ✅ Publication history tracking
- ✅ Citation metadata
- ✅ Plugin settings compatibility
- ✅ Multi-language support (ready)

## 📋 Prerequisites

- Node.js 18+
- npm atau yarn
- Akun Supabase (gratis)
- Google Drive API credentials (untuk file storage)
- Akses ke database OJS (jika melakukan migrasi)

## 🛠️ Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd ojs-nextjs-multitenant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Drive (untuk file storage)
GOOGLE_DRIVE_ACCESS_TOKEN=your_access_token
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

### 4. Setup Database

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan `supabase/schema.sql` (schema dasar)
3. Jalankan `supabase/schema-extensions.sql` (extensions)

### 5. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📚 Dokumentasi

- **[SETUP.md](./SETUP.md)** - Panduan setup lengkap
- **[MIGRATION.md](./MIGRATION.md)** - Panduan migrasi data dari OJS
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Dokumentasi arsitektur sistem
- **[QA_CHECKLIST.md](./QA_CHECKLIST.md)** - Checklist Quality Assurance

## 🔄 Migrasi Data dari OJS

Untuk migrasi data dari OJS PKP:

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

Lihat [MIGRATION.md](./MIGRATION.md) untuk detail lengkap.

## 🏗️ Struktur Project

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages (protected)
│   ├── login/             # Authentication
│   └── register/
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── submissions/      # Submission components
│   └── settings/         # Settings components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase client setup
│   └── google-drive.ts   # Google Drive integration
├── scripts/              # Migration scripts
│   └── migrate-ojs-to-supabase.ts
├── supabase/             # Database schema
│   ├── schema.sql        # Base schema
│   └── schema-extensions.sql  # Extensions
├── types/                # TypeScript types
└── tests/                # Test files
```

## 🔐 Authentication & Roles

### User Roles
- **Super Admin**: Full system access
- **Editor**: Manage journal, assign reviewers, make decisions
- **Section Editor**: Manage specific section
- **Reviewer**: Review submissions
- **Author**: Submit articles
- **Reader**: Read published articles

### Authentication Flow
1. User register/login via Supabase Auth
2. JWT token disimpan di httpOnly cookie
3. Middleware check authentication di setiap request
4. Role-based access control via RLS policies

## 📁 File Storage (Google Drive)

File PDF disimpan di Google Drive dan diakses via `webViewLink`:

```typescript
// Upload file
const response = await fetch('/api/google-drive/upload', {
  method: 'POST',
  body: formData
})

// View PDF
<iframe src={webViewLink} />
```

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy!

Lihat [ARCHITECTURE.md](./ARCHITECTURE.md) untuk detail deployment.

## 📄 License

GNU General Public License v3.0 (GPL-3.0)

Sistem ini adalah reimplementasi OJS PKP dan menggunakan license yang sama untuk compliance.

**Original OJS**: Copyright (C) 2000-2024 Public Knowledge Project  
**This Implementation**: Copyright (C) 2024 OJS Next.js Clone

Lihat [LICENSE](./LICENSE) untuk detail lengkap.

## 🙏 Attribution

Sistem ini adalah functional clone dari **Open Journal Systems (OJS)** yang dikembangkan oleh **Public Knowledge Project (PKP)**.

- Original OJS: https://pkp.sfu.ca/ojs/
- PKP: https://pkp.sfu.ca/

## 🤝 Contributing

Contributions welcome! Silakan:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push dan create Pull Request

## 📞 Support

- **Issues**: Buat issue di GitHub
- **Documentation**: Lihat folder `docs/`
- **Migration Help**: Lihat [MIGRATION.md](./MIGRATION.md)

## ✅ Roadmap

- [ ] Public-facing pages (journal homepage, article view)
- [ ] Search functionality
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Multi-language UI
- [ ] Custom themes

## 📊 Status

- ✅ Core functionality
- ✅ Database schema
- ✅ Authentication
- ✅ Submission workflow
- ✅ Review system
- ✅ Publishing
- ✅ Google Drive integration
- ✅ Migration scripts
- ⏳ Public-facing UI (in progress)
- ⏳ Advanced features

---

**Note**: Sistem ini dalam tahap development aktif. Beberapa fitur mungkin masih dalam development.
