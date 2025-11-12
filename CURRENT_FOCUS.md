# 🎯 Current Focus - Development Priorities

**Last Updated**: [Update tanggal]

---

## 🚧 In Progress: Site Administrator / Super Admin

**Status**: 🚧 **MASIH PERLU DIKERJAKAN** - Development Active

Halaman Super Admin (`/admin/*`) sudah ada tapi masih perlu improvement, testing, dan fitur tambahan.

**Halaman yang Sudah Selesai** (19 halaman):
- ✅ `/admin/dashboard`
- ✅ `/admin/users`
- ✅ `/admin/journals`
- ✅ `/admin/issues`
- ✅ `/admin/settings`
- ✅ `/admin/email-templates`
- ✅ `/admin/announcements`
- ✅ `/admin/navigation`
- ✅ `/admin/languages`
- ✅ `/admin/system/information`
- ✅ `/admin/statistics`
- ✅ `/admin/activity-log`
- ✅ `/admin/tasks`
- ✅ `/admin/api-keys`
- ✅ `/admin/plugins`
- ✅ `/admin/health`
- ✅ `/admin/maintenance`
- ✅ `/admin/backup`
- ✅ `/admin/crossref`

**Catatan**: Jangan edit halaman-halaman ini kecuali ada bug atau task maintenance spesifik.

---

## 🎯 Next Focus: Editor Dashboard

**Status**: 🚧 **PERLU DIKERJAKAN** - Setelah atau Parallel dengan Super Admin

**Total Halaman**: 14 halaman

### Priority Order (Disarankan)

#### Phase 1: Core Editor Functions (Prioritas Tinggi)
1. ✅ `feature/editor-dashboard-home` - Dashboard utama Editor
2. ✅ `feature/editor-submissions-list` - List semua submissions
3. ✅ `feature/editor-submission-detail` - Detail & manage submission
4. ✅ `feature/editor-reviews-list` - List reviews
5. ✅ `feature/editor-review-detail` - Detail review

#### Phase 2: Content Management (Prioritas Menengah)
6. ✅ `feature/editor-articles-list` - Manage published articles
7. ✅ `feature/editor-articles-detail` - Detail article
8. ✅ `feature/editor-issues-list` - Manage issues
9. ✅ `feature/editor-issues-detail` - Detail issue
10. ✅ `feature/editor-issues-create` - Create new issue

#### Phase 3: Settings & Configuration (Prioritas Rendah)
11. ✅ `feature/editor-journals-list` - List accessible journals
12. ✅ `feature/editor-journals-detail` - Journal details
13. ✅ `feature/editor-settings` - Editor settings
14. ✅ `feature/editor-submission-new` - Create submission (optional)

### Progress Tracking

| Halaman | Branch | Developer | Status | PR Link |
|---------|--------|-----------|--------|---------|
| Dashboard Home | `feature/editor-dashboard-home` | [ ] | [ ] | - |
| Submissions List | `feature/editor-submissions-list` | [ ] | [ ] | - |
| Submission Detail | `feature/editor-submission-detail` | [ ] | [ ] | - |
| Submission New | `feature/editor-submission-new` | [ ] | [ ] | - |
| Reviews List | `feature/editor-reviews-list` | [ ] | [ ] | - |
| Review Detail | `feature/editor-review-detail` | [ ] | [ ] | - |
| Articles List | `feature/editor-articles-list` | [ ] | [ ] | - |
| Articles Detail | `feature/editor-articles-detail` | [ ] | [ ] | - |
| Issues List | `feature/editor-issues-list` | [ ] | [ ] | - |
| Issues Detail | `feature/editor-issues-detail` | [ ] | [ ] | - |
| Issues Create | `feature/editor-issues-create` | [ ] | [ ] | - |
| Journals List | `feature/editor-journals-list` | [ ] | [ ] | - |
| Journals Detail | `feature/editor-journals-detail` | [ ] | [ ] | - |
| Settings | `feature/editor-settings` | [ ] | [ ] | - |

---

## 📋 Next Phase: Author, Reviewer & Public Pages

**Status**: ⏸️ **ON HOLD** - Menunggu Editor Dashboard Selesai

**Total Halaman**: 13 halaman

Akan dikerjakan setelah Editor Dashboard selesai atau parallel jika ada tim terpisah.

### Author Pages (4 halaman)
- `feature/author-submissions-list`
- `feature/author-submission-create`
- `feature/author-submission-detail`
- `feature/author-articles-list`

### Reviewer Pages (3 halaman)
- `feature/reviewer-assignments-list`
- `feature/reviewer-assignment-detail`
- `feature/reviewer-history`

### Public Pages (6 halaman)
- `feature/public-homepage`
- `feature/public-journal-homepage`
- `feature/public-journal-about`
- `feature/public-journal-articles`
- `feature/public-article-detail`
- `feature/public-search`

---

## 🚀 Quick Start untuk Developer

### Mulai Kerja di Editor Dashboard

1. **Pilih halaman** dari priority list di atas
2. **Buat branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/editor-[page-name]
   ```
3. **Lihat detail task** di [BRANCH_STRUCTURE.md](./BRANCH_STRUCTURE.md)
4. **Kerjakan sesuai task list**
5. **Buat PR** setelah selesai

### Resources

- **Detail Tasks**: [BRANCH_STRUCTURE.md](./BRANCH_STRUCTURE.md)
- **Quick Reference**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Collaboration Guide**: [COLLABORATION_GUIDE.md](./COLLABORATION_GUIDE.md)

---

## 📊 Overall Progress

- 🚧 **Super Admin**: 19 halaman ada, perlu improvement (Progress: ?%)
- 🚧 **Editor Dashboard**: 0/14 halaman (0%)
- ⏸️ **Author/Reviewer/Public**: 0/13 halaman (0%)

**Total**: 19/46 halaman ada (41%), tapi masih perlu development

---

**Update file ini setiap kali ada progress atau perubahan fokus!**

