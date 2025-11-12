# ⚡ Quick Reference - Branch & Halaman

## 🎯 3 Tim Overview

| Tim | Warna | Status | Total Halaman | Branch Pattern |
|-----|-------|--------|---------------|----------------|
| 🟣 **TIM 1** | Site Admin | 🚧 In Progress | 19 | `feature/admin-[page]-[improvement]` / `bugfix/admin-[page]-[issue]` |
| 🔵 **TIM 2** | Editor | 🚧 To Do | 14 | `feature/editor-[page-name]` |
| 🟢 **TIM 3** | Author/Reviewer/Public | 🚧 To Do | 13 | `feature/[type]-[page-name]` |

---

## 🔵 TIM 2: Editor Dashboard (14 halaman)

| # | Branch Name | Route | File | Status |
|---|-------------|-------|------|--------|
| 1 | `feature/editor-dashboard-home` | `/dashboard` | `app/dashboard/page.tsx` | [ ] |
| 2 | `feature/editor-submissions-list` | `/dashboard/submissions` | `app/dashboard/submissions/page.tsx` | [ ] |
| 3 | `feature/editor-submission-detail` | `/dashboard/submissions/[id]` | `app/dashboard/submissions/[id]/page.tsx` | [ ] |
| 4 | `feature/editor-submission-new` | `/dashboard/submissions/new` | `app/dashboard/submissions/new/page.tsx` | [ ] |
| 5 | `feature/editor-reviews-list` | `/dashboard/reviews` | `app/dashboard/reviews/page.tsx` | [ ] |
| 6 | `feature/editor-review-detail` | `/dashboard/reviews/[id]` | `app/dashboard/reviews/[id]/page.tsx` | [ ] |
| 7 | `feature/editor-articles-list` | `/dashboard/articles` | `app/dashboard/articles/page.tsx` | [ ] |
| 8 | `feature/editor-articles-detail` | `/dashboard/articles/[id]` | `app/dashboard/articles/[id]/page.tsx` | [ ] |
| 9 | `feature/editor-issues-list` | `/dashboard/issues` | `app/dashboard/issues/page.tsx` | [ ] |
| 10 | `feature/editor-issues-detail` | `/dashboard/issues/[id]` | `app/dashboard/issues/[id]/page.tsx` | [ ] |
| 11 | `feature/editor-issues-create` | `/dashboard/issues/new` | `app/dashboard/issues/new/page.tsx` | [ ] |
| 12 | `feature/editor-journals-list` | `/dashboard/journals` | `app/dashboard/journals/page.tsx` | [ ] |
| 13 | `feature/editor-journals-detail` | `/dashboard/journals/[id]` | `app/dashboard/journals/[id]/page.tsx` | [ ] |
| 14 | `feature/editor-settings` | `/dashboard/settings` | `app/dashboard/settings/page.tsx` | [ ] |

---

## 🟢 TIM 3: Author, Reviewer & Public (13 halaman)

### Author Pages (4 halaman)

| # | Branch Name | Route | File | Status |
|---|-------------|-------|------|--------|
| 1 | `feature/author-submissions-list` | `/dashboard/author/submissions` | `app/dashboard/author/submissions/page.tsx` | [ ] |
| 2 | `feature/author-submission-create` | `/dashboard/author/submissions/new` | `app/dashboard/author/submissions/new/page.tsx` | [ ] |
| 3 | `feature/author-submission-detail` | `/dashboard/author/submissions/[id]` | `app/dashboard/author/submissions/[id]/page.tsx` | [ ] |
| 4 | `feature/author-articles-list` | `/dashboard/author/articles` | `app/dashboard/author/articles/page.tsx` | [ ] |

### Reviewer Pages (3 halaman)

| # | Branch Name | Route | File | Status |
|---|-------------|-------|------|--------|
| 5 | `feature/reviewer-assignments-list` | `/dashboard/reviewer/assignments` | `app/dashboard/reviewer/assignments/page.tsx` | [ ] |
| 6 | `feature/reviewer-assignment-detail` | `/dashboard/reviewer/assignments/[id]` | `app/dashboard/reviewer/assignments/[id]/page.tsx` | [ ] |
| 7 | `feature/reviewer-history` | `/dashboard/reviewer/history` | `app/dashboard/reviewer/history/page.tsx` | [ ] |

### Public Pages (6 halaman)

| # | Branch Name | Route | File | Status |
|---|-------------|-------|------|--------|
| 8 | `feature/public-homepage` | `/` | `app/page.tsx` | [ ] |
| 9 | `feature/public-journal-homepage` | `/journal/[slug]` | `app/journal/[slug]/page.tsx` | [ ] |
| 10 | `feature/public-journal-about` | `/journal/[slug]/about` | `app/journal/[slug]/about/page.tsx` | [ ] |
| 11 | `feature/public-journal-articles` | `/journal/[slug]/articles` | `app/journal/[slug]/articles/page.tsx` | [ ] |
| 12 | `feature/public-article-detail` | `/article/[id]` | `app/article/[id]/page.tsx` | [ ] |
| 13 | `feature/public-search` | `/search` | `app/search/page.tsx` | [ ] |

---

## 🟣 TIM 1: Site Administrator (In Progress)

**Halaman sudah ada tapi masih perlu improvement, testing, dan fitur tambahan.**

| Halaman | Route | File | Branch Pattern |
|---------|-------|------|----------------|
| Dashboard | `/admin/dashboard` | `app/(super-admin)/admin/dashboard/page.tsx` | `feature/admin-dashboard-[improvement]` |
| Users | `/admin/users` | `app/(super-admin)/admin/users/page.tsx` | `feature/admin-users-[improvement]` |
| Journals | `/admin/journals` | `app/(super-admin)/admin/journals/page.tsx` | `feature/admin-journals-[improvement]` |
| Issues | `/admin/issues` | `app/(super-admin)/admin/issues/page.tsx` | `feature/admin-issues-[improvement]` |
| Settings | `/admin/settings` | `app/(super-admin)/admin/settings/page.tsx` | `feature/admin-settings-[improvement]` |
| ... | ... | ... | ... |

**Lihat [SUPER_ADMIN_TASKS.md](./SUPER_ADMIN_TASKS.md) untuk detail task list lengkap.**

---

## 🚀 Quick Commands

### Buat Branch Baru
```bash
# 1. Update develop
git checkout develop
git pull origin develop

# 2. Buat branch baru (contoh: editor submissions list)
git checkout -b feature/editor-submissions-list

# 3. Push branch
git push -u origin feature/editor-submissions-list
```

### Setelah Selesai Development
```bash
# 1. Commit changes
git add .
git commit -m "feat(editor): add submissions list page"

# 2. Push
git push origin feature/editor-submissions-list

# 3. Buat PR di GitHub ke develop
```

### Setelah PR Merged
```bash
# 1. Kembali ke develop
git checkout develop
git pull origin develop

# 2. Delete local branch
git branch -d feature/editor-submissions-list

# 3. Delete remote branch (optional)
git push origin --delete feature/editor-submissions-list
```

---

## 📋 Checklist Sebelum PR

- [ ] Code sudah di-test di local
- [ ] Tidak ada TypeScript errors
- [ ] Tidak ada linting errors
- [ ] Sudah sync dengan develop terbaru
- [ ] Commit messages sudah jelas
- [ ] PR description sudah lengkap
- [ ] Link Trello card (jika ada)

---

## 📚 Dokumentasi Lengkap

- **[BRANCH_STRUCTURE.md](./BRANCH_STRUCTURE.md)** - Detail lengkap semua branch & tasks
- **[COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)** - Panduan kolaborasi lengkap
- **[TRELLO_SETUP.md](./TRELLO_SETUP.md)** - Setup Trello untuk project management
- **[TEAM_PROGRESS.md](./TEAM_PROGRESS.md)** - Tracking progress tim

---

**Update status di file ini saat mulai/selesai halaman!**

