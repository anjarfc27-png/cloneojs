# 🌿 Struktur Branch per Halaman - OJS Development

## 📋 Overview

Setiap halaman akan dikerjakan di **branch terpisah** untuk menghindari conflict dan memudahkan review.

**3 Tim**:
- 🟣 **Tim 1: Site Administrator** (Maintenance & Bug Fixes)
- 🔵 **Tim 2: Editor Dashboard** (Editor Pages)
- 🟢 **Tim 3: Author, Reviewer & Public** (Author, Reviewer, Public Pages)

---

## 🟣 TIM 1: Site Administrator / Super Admin 🚧 IN PROGRESS

**Status**: 🚧 **MASIH PERLU DIKERJAKAN** - Development Active

**Catatan**: Halaman Super Admin (`/admin/*`) masih dalam development. 
Banyak fitur yang masih perlu diselesaikan atau diperbaiki.

### Branch Structure
```
main
└── develop
    ├── feature/admin-dashboard-improvements
    ├── feature/admin-users-enhancements
    ├── feature/admin-journals-features
    ├── feature/admin-settings-updates
    ├── bugfix/admin-dashboard-[issue]
    ├── bugfix/admin-users-[issue]
    └── ... (feature & bugfix branches sesuai kebutuhan)
```

**Branch Pattern**:
- `feature/admin-[page]-[improvement]` - Fitur baru atau improvement
- `bugfix/admin-[page]-[issue]` - Perbaikan bug

### Halaman Super Admin yang Perlu Dikerjakan/Diperbaiki

**Catatan**: Halaman-halaman berikut sudah ada tapi masih perlu improvement, testing, atau fitur tambahan.

#### Admin Dashboard
- 🚧 `/admin/dashboard` → `app/(super-admin)/admin/dashboard/page.tsx`
- **Status**: Sudah ada, perlu improvement/testing
- **Branches**:
  - `feature/admin-dashboard-improvements` - UI/UX improvements
  - `feature/admin-dashboard-statistics` - Enhanced statistics
  - `bugfix/admin-dashboard-[issue]` - Bug fixes

#### Management Pages
- ✅ `/admin/users` → `app/(super-admin)/admin/users/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-users-[deskripsi-bug]`

- ✅ `/admin/journals` → `app/(super-admin)/admin/journals/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-journals-[deskripsi-bug]`

- ✅ `/admin/issues` → `app/(super-admin)/admin/issues/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-issues-[deskripsi-bug]`

#### Settings Pages
- ✅ `/admin/settings` → `app/(super-admin)/admin/settings/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-settings-[deskripsi-bug]`

- ✅ `/admin/email-templates` → `app/(super-admin)/admin/email-templates/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-email-templates-[deskripsi-bug]`

- ✅ `/admin/announcements` → `app/(super-admin)/admin/announcements/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-announcements-[deskripsi-bug]`

- ✅ `/admin/navigation` → `app/(super-admin)/admin/navigation/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-navigation-[deskripsi-bug]`

- ✅ `/admin/languages` → `app/(super-admin)/admin/languages/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-languages-[deskripsi-bug]`

#### System Pages
- ✅ `/admin/system/information` → `app/(super-admin)/admin/system/information/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-system-info-[deskripsi-bug]`

- ✅ `/admin/statistics` → `app/(super-admin)/admin/statistics/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-statistics-[deskripsi-bug]`

- ✅ `/admin/activity-log` → `app/(super-admin)/admin/activity-log/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-activity-log-[deskripsi-bug]`

- ✅ `/admin/tasks` → `app/(super-admin)/admin/tasks/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-tasks-[deskripsi-bug]`

- ✅ `/admin/api-keys` → `app/(super-admin)/admin/api-keys/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-api-keys-[deskripsi-bug]`

- ✅ `/admin/plugins` → `app/(super-admin)/admin/plugins/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-plugins-[deskripsi-bug]`

- ✅ `/admin/health` → `app/(super-admin)/admin/health/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-health-[deskripsi-bug]`

- ✅ `/admin/maintenance` → `app/(super-admin)/admin/maintenance/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-maintenance-[deskripsi-bug]`

- ✅ `/admin/backup` → `app/(super-admin)/admin/backup/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-backup-[deskripsi-bug]`

- ✅ `/admin/crossref` → `app/(super-admin)/admin/crossref/page.tsx`
- **Branch untuk bug fix**: `bugfix/admin-crossref-[deskripsi-bug]`

---

## 🔵 TIM 2: Editor Dashboard 🎯 FOKUS UTAMA

**Status**: 🚧 **PERLU DIKERJAKAN** - Fokus Development Sekarang

**Prioritas**: Setelah Super Admin selesai, fokus utama adalah Editor Dashboard.

### Branch Structure
```
develop
├── feature/editor-dashboard-home
├── feature/editor-submissions-list
├── feature/editor-submission-detail
├── feature/editor-submission-new
├── feature/editor-reviews-list
├── feature/editor-review-detail
├── feature/editor-articles-list
├── feature/editor-articles-detail
├── feature/editor-issues-list
├── feature/editor-issues-detail
├── feature/editor-issues-create
├── feature/editor-journals-list
├── feature/editor-journals-detail
└── feature/editor-settings
```

### Halaman yang Perlu Dikerjakan

#### 1. Editor Dashboard Home
- **Route**: `/dashboard`
- **File**: `app/dashboard/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-dashboard-home`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Improve UI/UX
- [ ] Add statistics cards
- [ ] Add recent activity
- [ ] Test functionality

---

#### 2. Editor Submissions List
- **Route**: `/dashboard/submissions`
- **File**: `app/dashboard/submissions/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-submissions-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Add filters (status, journal, date)
- [ ] Add search functionality
- [ ] Improve table UI
- [ ] Add bulk actions
- [ ] Test functionality

---

#### 3. Editor Submission Detail
- **Route**: `/dashboard/submissions/[id]`
- **File**: `app/dashboard/submissions/[id]/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-submission-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Improve UI layout
- [ ] Add assign reviewer functionality (check existing)
- [ ] Add review decision form (check existing)
- [ ] Add publish article form
- [ ] Test all workflows

---

#### 4. Editor Create Submission (Optional)
- **Route**: `/dashboard/submissions/new`
- **File**: `app/dashboard/submissions/new/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-submission-new`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Improve form UI
- [ ] Add validation
- [ ] Test submission flow

---

#### 5. Editor Reviews List
- **Route**: `/dashboard/reviews`
- **File**: `app/dashboard/reviews/page.tsx` (perlu dibuat atau review existing)
- **Branch**: `feature/editor-reviews-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Check if file exists
- [ ] Create/review page
- [ ] List all reviews in journal
- [ ] Add filters (status, reviewer, date)
- [ ] Add search
- [ ] Test functionality

---

#### 6. Editor Review Detail
- **Route**: `/dashboard/reviews/[id]`
- **File**: `app/dashboard/reviews/[id]/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-review-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Improve UI layout
- [ ] Show review comments
- [ ] Show reviewer info
- [ ] Add decision actions
- [ ] Test functionality

---

#### 7. Editor Articles List
- **Route**: `/dashboard/articles`
- **File**: `app/dashboard/articles/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-articles-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] List published articles
- [ ] Add filters (journal, issue, date)
- [ ] Add search
- [ ] Add edit/delete actions
- [ ] Test functionality

---

#### 8. Editor Articles Detail (Optional)
- **Route**: `/dashboard/articles/[id]`
- **File**: `app/dashboard/articles/[id]/page.tsx` (perlu dibuat)
- **Branch**: `feature/editor-articles-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Show article details
- [ ] Add edit functionality
- [ ] Add unpublish action
- [ ] Test functionality

---

#### 9. Editor Issues List
- **Route**: `/dashboard/issues`
- **File**: `app/dashboard/issues/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-issues-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] List issues in journal
- [ ] Add filters (volume, year, status)
- [ ] Add search
- [ ] Improve UI
- [ ] Test functionality

---

#### 10. Editor Issue Detail
- **Route**: `/dashboard/issues/[id]`
- **File**: `app/dashboard/issues/[id]/page.tsx` (perlu dibuat)
- **Branch**: `feature/editor-issues-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Show issue details
- [ ] List articles in issue
- [ ] Add edit functionality
- [ ] Add publish/unpublish
- [ ] Test functionality

---

#### 11. Editor Create Issue
- **Route**: `/dashboard/issues/new`
- **File**: `app/dashboard/issues/new/page.tsx` (perlu dibuat)
- **Branch**: `feature/editor-issues-create`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Create issue form
- [ ] Add validation
- [ ] Test creation flow

---

#### 12. Editor Journals List
- **Route**: `/dashboard/journals`
- **File**: `app/dashboard/journals/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-journals-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] List journals user has access to
- [ ] Add filters
- [ ] Improve UI
- [ ] Test functionality

---

#### 13. Editor Journal Detail (Optional)
- **Route**: `/dashboard/journals/[id]`
- **File**: `app/dashboard/journals/[id]/page.tsx` (perlu dibuat)
- **Branch**: `feature/editor-journals-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Show journal details
- [ ] Show statistics
- [ ] Add edit functionality (if allowed)
- [ ] Test functionality

---

#### 14. Editor Settings
- **Route**: `/dashboard/settings`
- **File**: `app/dashboard/settings/page.tsx` (sudah ada, perlu review/improve)
- **Branch**: `feature/editor-settings`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Editor profile settings
- [ ] Journal preferences
- [ ] Notification settings
- [ ] Test functionality

---

## 🟢 TIM 3: Author, Reviewer & Public Pages

**Status**: 🚧 **PERLU DIKERJAKAN** - Setelah Editor Dashboard

**Prioritas**: Dikerjakan setelah Editor Dashboard selesai atau parallel jika ada tim terpisah.

### Branch Structure
```
develop
├── feature/author-submissions-list
├── feature/author-submission-create
├── feature/author-submission-detail
├── feature/author-articles-list
├── feature/reviewer-assignments-list
├── feature/reviewer-assignment-detail
├── feature/reviewer-history
├── feature/public-homepage
├── feature/public-journal-homepage
├── feature/public-journal-about
├── feature/public-journal-articles
├── feature/public-article-detail
└── feature/public-search
```

### Author Pages

#### 1. Author Submissions List
- **Route**: `/dashboard/author/submissions`
- **File**: `app/dashboard/author/submissions/page.tsx` (perlu dibuat)
- **Branch**: `feature/author-submissions-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] List my submissions only
- [ ] Filter by status (draft, submitted, under_review, etc)
- [ ] Add search
- [ ] Add create new button
- [ ] Test functionality

---

#### 2. Author Create Submission
- **Route**: `/dashboard/author/submissions/new`
- **File**: `app/dashboard/author/submissions/new/page.tsx` (perlu dibuat)
- **Branch**: `feature/author-submission-create`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Create submission form
- [ ] Add file upload (PDF)
- [ ] Add validation
- [ ] Save as draft functionality
- [ ] Submit functionality
- [ ] Test flow

---

#### 3. Author Submission Detail
- **Route**: `/dashboard/author/submissions/[id]`
- **File**: `app/dashboard/author/submissions/[id]/page.tsx` (perlu dibuat)
- **Branch**: `feature/author-submission-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Show submission details
- [ ] Edit functionality (if draft)
- [ ] View status
- [ ] Upload revision (if requested)
- [ ] View review comments (if allowed)
- [ ] Test functionality

---

#### 4. Author Articles List
- **Route**: `/dashboard/author/articles`
- **File**: `app/dashboard/author/articles/page.tsx` (perlu dibuat)
- **Branch**: `feature/author-articles-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] List my published articles
- [ ] Show publication date
- [ ] Link to public article view
- [ ] Add filters
- [ ] Test functionality

---

### Reviewer Pages

#### 5. Reviewer Assignments List
- **Route**: `/dashboard/reviewer/assignments`
- **File**: `app/dashboard/reviewer/assignments/page.tsx` (perlu dibuat)
- **Branch**: `feature/reviewer-assignments-list`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] List my review assignments
- [ ] Filter by status (pending, accepted, declined, completed)
- [ ] Show due dates
- [ ] Add accept/decline actions
- [ ] Test functionality

---

#### 6. Reviewer Assignment Detail
- **Route**: `/dashboard/reviewer/assignments/[id]`
- **File**: `app/dashboard/reviewer/assignments/[id]/page.tsx` (perlu dibuat)
- **Branch**: `feature/reviewer-assignment-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Show submission details
- [ ] Download submission files
- [ ] Review form (comments, recommendation)
- [ ] Upload review files
- [ ] Submit review
- [ ] Test functionality

---

#### 7. Reviewer History
- **Route**: `/dashboard/reviewer/history`
- **File**: `app/dashboard/reviewer/history/page.tsx` (perlu dibuat)
- **Branch**: `feature/reviewer-history`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] List completed reviews
- [ ] Show review history
- [ ] Filter by date, journal
- [ ] Test functionality

---

### Public Pages

#### 8. Public Homepage
- **Route**: `/`
- **File**: `app/page.tsx` (sudah ada, perlu update)
- **Branch**: `feature/public-homepage`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] List all journals
- [ ] Add search journals
- [ ] Add filters
- [ ] Improve UI
- [ ] Test functionality

---

#### 9. Public Journal Homepage
- **Route**: `/journal/[slug]`
- **File**: `app/journal/[slug]/page.tsx` (sudah ada, perlu update)
- **Branch**: `feature/public-journal-homepage`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Show journal info
- [ ] Show latest articles
- [ ] Show announcements
- [ ] Add navigation menu
- [ ] Improve UI
- [ ] Test functionality

---

#### 10. Public Journal About
- **Route**: `/journal/[slug]/about`
- **File**: `app/journal/[slug]/about/page.tsx` (perlu dibuat)
- **Branch**: `feature/public-journal-about`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] Show journal description
- [ ] Show editorial team
- [ ] Show policies
- [ ] Test functionality

---

#### 11. Public Journal Articles
- **Route**: `/journal/[slug]/articles`
- **File**: `app/journal/[slug]/articles/page.tsx` (perlu dibuat)
- **Branch**: `feature/public-journal-articles`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Create page
- [ ] List published articles
- [ ] Filter by issue, year, author
- [ ] Add search
- [ ] Add pagination
- [ ] Test functionality

---

#### 12. Public Article Detail
- **Route**: `/article/[id]`
- **File**: `app/article/[id]/page.tsx` (sudah ada, perlu update)
- **Branch**: `feature/public-article-detail`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Show article content
- [ ] Show authors
- [ ] Show citation info
- [ ] Show PDF viewer
- [ ] Add related articles
- [ ] Improve UI
- [ ] Test functionality

---

#### 13. Public Search
- **Route**: `/search`
- **File**: `app/search/page.tsx` (sudah ada, perlu improve)
- **Branch**: `feature/public-search`
- **Developer**: [Assign]
- **Status**: [ ] Not Started / 🚧 In Progress / ✅ Done

**Tasks**:
- [ ] Review existing code
- [ ] Improve search functionality
- [ ] Add filters (journal, author, date)
- [ ] Add advanced search
- [ ] Improve UI
- [ ] Test functionality

---

## 🔄 Workflow per Branch

### 1. Buat Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/editor-submissions-list
```

### 2. Development
- Kerjakan halaman sesuai task list
- Commit sering dengan message yang jelas:
  ```bash
  git add .
  git commit -m "feat(editor): add submissions list page"
  ```

### 3. Push & Create PR
```bash
git push origin feature/editor-submissions-list
```
- Buat PR ke `develop`
- Link ke Trello card (jika ada)
- Tag reviewer

### 4. After Merge
```bash
git checkout develop
git pull origin develop
git branch -d feature/editor-submissions-list  # Delete local branch
```

---

## 📊 Progress Tracking

Update `TEAM_PROGRESS.md` dengan status setiap branch:
- [ ] Not Started
- 🚧 In Progress
- 👀 Review
- ✅ Done

---

## ⚠️ Important Notes

1. **Jangan edit file yang bukan tugas Anda** - Jika perlu, diskusikan dulu
2. **Satu halaman = satu branch** - Jangan gabung beberapa halaman dalam satu branch
3. **Sync dengan develop setiap hari** - Hindari conflict besar
4. **Test sebelum PR** - Pastikan tidak ada error
5. **Update Trello card** - Link PR di card description

---

**Happy Coding! 🚀**

