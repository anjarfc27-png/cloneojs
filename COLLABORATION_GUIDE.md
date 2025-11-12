# 🚀 Panduan Kolaborasi Tim - OJS Next.js Clone

## 📋 Daftar Modul & Halaman

### ✅ Sudah Selesai (Super Admin)
Modul-modul berikut sudah selesai dan **JANGAN DIEDIT** kecuali ada bug:

- ✅ `/admin/dashboard` - Dashboard Super Admin
- ✅ `/admin/users` - Manajemen Pengguna
- ✅ `/admin/journals` - Manajemen Jurnal
- ✅ `/admin/issues` - Manajemen Isu
- ✅ `/admin/settings` - Pengaturan Situs
- ✅ `/admin/email-templates` - Email Templates
- ✅ `/admin/announcements` - Announcements
- ✅ `/admin/navigation` - Navigation Menus
- ✅ `/admin/languages` - Languages
- ✅ `/admin/system/information` - System Information
- ✅ `/admin/statistics` - Statistics & Reports
- ✅ `/admin/activity-log` - Activity Log
- ✅ `/admin/tasks` - Scheduled Tasks
- ✅ `/admin/api-keys` - API Keys
- ✅ `/admin/plugins` - Plugins
- ✅ `/admin/health` - System Health
- ✅ `/admin/maintenance` - Data Maintenance
- ✅ `/admin/backup` - Backup & Restore

### 🚧 Perlu Dikerjakan (Dashboard untuk Role Lain)

#### 1. **Editor Dashboard** (`app/dashboard/`)
- [ ] `/dashboard` - Dashboard utama Editor
- [ ] `/dashboard/submissions` - List semua submissions (sudah ada, perlu review)
- [ ] `/dashboard/submissions/[id]` - Detail submission (sudah ada, perlu review)
- [ ] `/dashboard/submissions/new` - Create new submission (sudah ada, perlu review)
- [ ] `/dashboard/reviews` - List reviews yang di-assign
- [ ] `/dashboard/reviews/[id]` - Detail review (sudah ada, perlu review)
- [ ] `/dashboard/articles` - Manage published articles
- [ ] `/dashboard/issues` - Manage issues (sudah ada, perlu review)
- [ ] `/dashboard/journals` - Manage journals (sudah ada, perlu review)
- [ ] `/dashboard/settings` - Editor settings (sudah ada, perlu review)

#### 2. **Author Pages** (belum ada)
- [ ] `/dashboard/author/submissions` - My submissions
- [ ] `/dashboard/author/submissions/new` - Create submission
- [ ] `/dashboard/author/submissions/[id]` - View/edit submission
- [ ] `/dashboard/author/articles` - My published articles

#### 3. **Reviewer Pages** (belum ada)
- [ ] `/dashboard/reviewer/assignments` - My review assignments
- [ ] `/dashboard/reviewer/assignments/[id]` - Review submission
- [ ] `/dashboard/reviewer/history` - Review history

#### 4. **Public Pages** (belum ada)
- [ ] `/` - Homepage (journal list)
- [ ] `/journal/[slug]` - Journal homepage
- [ ] `/journal/[slug]/about` - About page
- [ ] `/journal/[slug]/articles` - Article list
- [ ] `/article/[id]` - Article detail page
- [ ] `/search` - Search page (sudah ada, perlu review)

---

## 🌿 Git Branching Strategy

### Branch Structure

```
main (production-ready)
├── develop (integration branch)
    ├── feature/editor-dashboard
    ├── feature/author-pages
    ├── feature/reviewer-pages
    ├── feature/public-pages
    └── bugfix/...
```

### Workflow

1. **Buat branch dari `develop`**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nama-modul
   ```

2. **Naming Convention**
   - `feature/editor-dashboard` - Fitur baru
   - `bugfix/submission-bug` - Perbaikan bug
   - `refactor/auth-system` - Refactoring
   - `docs/update-readme` - Dokumentasi

3. **Commit Messages**
   ```
   feat(editor): add submission list page
   fix(auth): resolve login redirect issue
   refactor(components): extract common form logic
   docs(readme): update setup instructions
   ```

4. **Push & Create Pull Request**
   ```bash
   git push origin feature/nama-modul
   ```
   Lalu buat PR ke `develop` di GitHub/GitLab

---

## 📋 Trello Integration (Project Management)

### Setup Trello Board

**Ya, Trello bisa digunakan bersamaan dengan GitHub!** Trello sangat cocok untuk project management dan tracking tasks.

### Recommended Board Structure

```
📋 OJS Development Board
│
├── 📌 Backlog
│   └── Semua task yang belum mulai
│
├── 🚧 To Do
│   └── Task yang siap dikerjakan
│
├── 👨‍💻 In Progress
│   ├── Editor Dashboard (Member 1)
│   ├── Author Pages (Member 2)
│   ├── Reviewer Pages (Member 3)
│   └── Public Pages (Member 4)
│
├── 👀 Review
│   └── PR yang sedang di-review
│
├── ✅ Done
│   └── Task yang sudah selesai
│
└── 🐛 Bugs
    └── Bug reports dan fixes
```

### Card Template untuk Trello

**Title**: `[Module] Task Name`

**Description**:
```
**Branch**: `feature/module-name`
**Developer**: @username
**Related Issue**: #123

## Task
- [ ] Subtask 1
- [ ] Subtask 2
- [ ] Subtask 3

## Files to Create/Edit
- `app/path/page.tsx`
- `components/Component.tsx`

## Dependencies
- Needs: [module/component]
- Blocks: [other task]

## Notes
[Additional notes]
```

**Labels** (Warna):
- 🔵 `feature` - Fitur baru
- 🟢 `bugfix` - Perbaikan bug
- 🟡 `refactor` - Refactoring
- 🟣 `editor` - Editor Dashboard
- 🟠 `author` - Author Pages
- 🔴 `reviewer` - Reviewer Pages
- ⚪ `public` - Public Pages

**Checklist**:
- [ ] Design/Planning
- [ ] Development
- [ ] Testing
- [ ] Code Review
- [ ] Merge to Develop

### Integrasi Trello dengan GitHub

#### Option 1: Manual Linking
1. Di Trello card, tambahkan link ke GitHub issue/PR:
   ```
   Related: https://github.com/username/repo/issues/123
   PR: https://github.com/username/repo/pull/456
   ```

2. Di GitHub commit message, mention Trello card:
   ```bash
   git commit -m "feat(editor): add submission list

   Closes #123
   Related to Trello: [Card Name](link)"
   ```

#### Option 2: Power-Ups (Trello Premium/Enterprise)
- **GitHub Power-Up**: Auto-link cards dengan GitHub issues/PRs
- **Butler Power-Up**: Auto-update cards berdasarkan GitHub activity

#### Option 3: GitHub Actions (Advanced)
Setup automation untuk update Trello dari GitHub:
```yaml
# .github/workflows/trello-sync.yml
name: Trello Sync
on:
  pull_request:
    types: [opened, closed]
jobs:
  update-trello:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update Trello Card
        # Add Trello API integration
```

### Workflow dengan Trello

1. **Planning Phase**
   - Buat card di **Backlog** untuk setiap task
   - Assign ke developer
   - Set due date jika ada deadline

2. **Development Phase**
   - Pindahkan card ke **In Progress** saat mulai kerja
   - Update checklist di card saat progress
   - Link PR di card description

3. **Review Phase**
   - Pindahkan card ke **Review** saat PR dibuat
   - Reviewer bisa lihat card untuk context
   - Update card dengan review feedback

4. **Done Phase**
   - Pindahkan ke **Done** setelah merge
   - Archive card setelah 1-2 minggu

### Tips Menggunakan Trello

✅ **DO**:
- Update card setiap hari dengan progress
- Link PR/Issue di card description
- Gunakan labels untuk filtering
- Update checklist saat selesai subtask
- Comment di card untuk komunikasi

❌ **DON'T**:
- Jangan biarkan card di "In Progress" terlalu lama tanpa update
- Jangan duplicate card untuk task yang sama
- Jangan lupa update card saat PR merged

### Trello Board Template

**Quick Setup**:
1. Buat board baru: "OJS Development"
2. Buat lists: Backlog, To Do, In Progress, Review, Done, Bugs
3. Copy task dari `COLLABORATION_GUIDE.md` ke cards
4. Assign cards ke team members
5. Set labels dan due dates

**Card Example**:
```
Title: [Editor] Review Submission List Page

Labels: 🔵 feature, 🟣 editor
Members: @member1
Due: [Date]

Description:
**Branch**: `feature/editor-dashboard`
**Files**: `app/dashboard/submissions/page.tsx`

Checklist:
- [x] Review existing code
- [ ] Improve UI/UX
- [ ] Add filters
- [ ] Test functionality
- [ ] Create PR

PR: [Link setelah PR dibuat]
```

---

## 👥 Pembagian Kerja yang Disarankan

### Tim Member 1: Editor Dashboard
**Branch**: `feature/editor-dashboard`

**Tugas**:
- ✅ Review & improve `/dashboard/submissions` (sudah ada)
- ✅ Review & improve `/dashboard/submissions/[id]` (sudah ada)
- ✅ Review & improve `/dashboard/reviews` (sudah ada)
- ✅ Review & improve `/dashboard/reviews/[id]` (sudah ada)
- ✅ Review & improve `/dashboard/articles` (sudah ada)
- ✅ Review & improve `/dashboard/issues` (sudah ada)
- ✅ Review & improve `/dashboard/settings` (sudah ada)

**Files yang akan dikerjakan**:
- `app/dashboard/submissions/page.tsx`
- `app/dashboard/submissions/[id]/page.tsx`
- `app/dashboard/reviews/page.tsx`
- `app/dashboard/reviews/[id]/page.tsx`
- `app/dashboard/articles/page.tsx`
- `components/submissions/*`
- `components/reviews/*`

**Dependencies**:
- Server Actions di `actions/submissions/`
- Server Actions di `actions/reviews/`

---

### Tim Member 2: Author Pages
**Branch**: `feature/author-pages`

**Tugas**:
- [ ] Create `/dashboard/author/submissions` - List my submissions
- [ ] Create `/dashboard/author/submissions/new` - Create submission form
- [ ] Create `/dashboard/author/submissions/[id]` - View/edit submission
- [ ] Create `/dashboard/author/articles` - My published articles

**Files yang akan dibuat**:
- `app/dashboard/author/submissions/page.tsx`
- `app/dashboard/author/submissions/new/page.tsx`
- `app/dashboard/author/submissions/[id]/page.tsx`
- `app/dashboard/author/articles/page.tsx`
- `components/author/SubmissionForm.tsx`
- `components/author/SubmissionList.tsx`

**Dependencies**:
- Reuse Server Actions dari `actions/submissions/`
- Reuse components dari `components/submissions/`

---

### Tim Member 3: Reviewer Pages
**Branch**: `feature/reviewer-pages`

**Tugas**:
- [ ] Create `/dashboard/reviewer/assignments` - List assignments
- [ ] Create `/dashboard/reviewer/assignments/[id]` - Review form
- [ ] Create `/dashboard/reviewer/history` - Review history

**Files yang akan dibuat**:
- `app/dashboard/reviewer/assignments/page.tsx`
- `app/dashboard/reviewer/assignments/[id]/page.tsx`
- `app/dashboard/reviewer/history/page.tsx`
- `components/reviewer/ReviewForm.tsx`
- `components/reviewer/AssignmentList.tsx`

**Dependencies**:
- Server Actions di `actions/reviews/` (perlu dibuat jika belum ada)
- Reuse components dari `components/reviews/`

---

### Tim Member 4: Public Pages
**Branch**: `feature/public-pages`

**Tugas**:
- [ ] Create `/` - Homepage (journal list)
- [ ] Create `/journal/[slug]` - Journal homepage
- [ ] Create `/journal/[slug]/about` - About page
- [ ] Create `/journal/[slug]/articles` - Article list
- [ ] Create `/article/[id]` - Article detail
- [ ] Improve `/search` (sudah ada)

**Files yang akan dibuat**:
- `app/page.tsx` (update existing)
- `app/journal/[slug]/page.tsx` (update existing)
- `app/journal/[slug]/about/page.tsx`
- `app/journal/[slug]/articles/page.tsx`
- `app/article/[id]/page.tsx` (update existing)
- `components/journal/JournalHomepage.tsx`
- `components/article/ArticleView.tsx`

**Dependencies**:
- Server Actions di `actions/journals/`
- Server Actions di `actions/issues/`

---

## 📝 Best Practices

### 1. **Jangan Edit File yang Bukan Tugas Anda**
- Jika perlu perubahan di file lain, diskusikan dulu atau buat issue
- Gunakan `@todo` comment jika perlu perubahan di file lain

### 2. **Reuse Existing Code**
- Cek dulu apakah ada component/action yang bisa dipakai
- Jangan duplicate code, extract ke shared component jika perlu

### 3. **Follow Existing Patterns**
- Lihat contoh di `app/(super-admin)/admin/` untuk pattern yang sudah ada
- Gunakan Server Actions, bukan API routes
- Gunakan Zod validation di validators
- Gunakan audit logging

### 4. **Testing**
- Test di local sebelum push
- Pastikan tidak ada TypeScript errors
- Pastikan tidak ada linting errors

### 5. **Communication**
- Update progress di issue tracker
- Komunikasi jika ada blocking issue
- Review PR teman tim

---

## 🔄 Sync dengan Main Branch

### Setiap Hari
```bash
# Update develop branch
git checkout develop
git pull origin develop

# Update feature branch
git checkout feature/nama-modul
git merge develop
# Resolve conflicts jika ada
```

### Sebelum Push
```bash
# Check for conflicts
git fetch origin
git merge origin/develop

# Run linter
npm run lint

# Check TypeScript
npm run type-check
```

---

## 📊 Progress Tracking

### Cara Update Progress

1. **Update checklist di file ini** (mark dengan `[x]`)
2. **Update di issue tracker** (GitHub Issues/GitLab Issues)
3. **Update di PR description**

### Template Update Progress

```markdown
## Progress Update - [Nama Modul]

**Branch**: `feature/nama-modul`
**Developer**: [Nama]
**Date**: [Tanggal]

### Completed ✅
- [x] Task 1
- [x] Task 2

### In Progress 🚧
- [ ] Task 3 (50% done)

### Blocked ⚠️
- [ ] Task 4 (need help with X)

### Notes
- Perlu review untuk component Y
- Ada dependency dengan module Z
```

---

## 🚨 Conflict Resolution

### Jika Ada Conflict

1. **Jangan panic!** Conflict adalah hal normal
2. **Pull latest dari develop**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/nama-modul
   git merge develop
   ```
3. **Resolve conflict** dengan editor
4. **Test setelah resolve**
5. **Commit resolution**
   ```bash
   git add .
   git commit -m "resolve: merge conflicts with develop"
   ```

### Tips Menghindari Conflict

- **Sync setiap hari** dengan develop
- **Jangan edit file yang sama** dengan teman tim
- **Komunikasi** jika perlu edit file yang sama
- **Gunakan branch yang spesifik** (jangan kerja di develop)

---

## 📞 Kontak & Support

### Jika Ada Pertanyaan

1. **Cek dokumentasi** di folder root
2. **Cek existing code** untuk contoh
3. **Tanya di team chat** (Discord/Slack/etc)
4. **Buat issue** jika ada bug atau question

### Resources

- **Architecture**: `ARCHITECTURE.md`
- **Setup Guide**: `SETUP.md`
- **Migration Guide**: `MIGRATION.md`
- **QA Checklist**: `QA_CHECKLIST.md`

---

## ✅ Checklist Sebelum Merge ke Develop

- [ ] Semua task di modul sudah selesai
- [ ] Tidak ada TypeScript errors
- [ ] Tidak ada linting errors
- [ ] Sudah sync dengan develop terbaru
- [ ] Sudah di-test di local
- [ ] Code sudah di-review sendiri
- [ ] PR description sudah lengkap
- [ ] Tidak ada console.log yang tertinggal
- [ ] Tidak ada comment code yang tidak perlu

---

**Happy Coding! 🎉**

