# 📋 Panduan Setup Trello untuk OJS Development

## 🎯 Quick Start

### 1. Buat Board Baru
1. Login ke [Trello](https://trello.com)
2. Klik **"Create"** → **"Create Board"**
3. Nama: **"OJS Development"**
4. Visibility: **Team** (atau sesuai kebutuhan)

### 2. Buat Lists (Columns)

Buat lists berikut dari kiri ke kanan:

```
📌 Backlog | 🚧 To Do | 👨‍💻 In Progress | 👀 Review | ✅ Done | 🐛 Bugs
```

**Cara membuat**:
- Klik **"Add another list"** di kanan board
- Atau klik **"..."** → **"Add List"**

### 3. Buat Labels (Warna)

Klik **"..."** → **"Labels"** → Buat labels berikut:

| Label | Warna | Deskripsi |
|-------|-------|-----------|
| `feature` | 🔵 Blue | Fitur baru |
| `bugfix` | 🟢 Green | Perbaikan bug |
| `refactor` | 🟡 Yellow | Refactoring code |
| `editor` | 🟣 Purple | Editor Dashboard |
| `author` | 🟠 Orange | Author Pages |
| `reviewer` | 🔴 Red | Reviewer Pages |
| `public` | ⚪ White/Gray | Public Pages |
| `blocked` | ⚫ Black | Task terblokir |
| `priority` | 🔴 Red | High priority |

### 4. Invite Team Members

1. Klik **"Invite"** di sidebar kanan
2. Tambahkan email team members
3. Atau share link board

---

## 📝 Membuat Cards dari Tasks

### Template Card untuk Editor Dashboard

**Title**: `[Editor] Review Submission List Page`

**Description**:
```markdown
**Branch**: `feature/editor-dashboard`
**Developer**: @username
**Related Issue**: #123

## Task
Review dan improve halaman submission list untuk Editor

## Subtasks
- [ ] Review existing code di `app/dashboard/submissions/page.tsx`
- [ ] Check apakah ada bug atau issue
- [ ] Improve UI/UX jika perlu
- [ ] Add filters/search jika belum ada
- [ ] Test semua functionality
- [ ] Create PR ke develop

## Files to Edit
- `app/dashboard/submissions/page.tsx`
- `components/submissions/SubmissionList.tsx` (jika perlu)

## Dependencies
- Needs: Server Actions dari `actions/submissions/`
- Blocks: None

## Notes
- Pastikan mengikuti pattern yang sudah ada di Super Admin pages
- Gunakan Server Actions, bukan API routes
```

**Labels**: `feature`, `editor`
**Members**: Assign ke developer yang bertugas
**Due Date**: Set deadline jika ada

---

### Template Card untuk Author Pages

**Title**: `[Author] Create My Submissions Page`

**Description**:
```markdown
**Branch**: `feature/author-pages`
**Developer**: @username

## Task
Buat halaman untuk Author melihat semua submission mereka

## Subtasks
- [ ] Create `app/dashboard/author/submissions/page.tsx`
- [ ] Create component `components/author/SubmissionList.tsx`
- [ ] Implement filter by status (draft, submitted, under_review, etc)
- [ ] Add action buttons (view, edit, delete)
- [ ] Test functionality
- [ ] Create PR

## Files to Create
- `app/dashboard/author/submissions/page.tsx`
- `components/author/SubmissionList.tsx`

## Dependencies
- Needs: Server Actions dari `actions/submissions/get.ts`
- Can reuse: Components dari `components/submissions/`

## Notes
- Hanya show submissions milik user yang login
- Filter berdasarkan `submitter_id`
```

**Labels**: `feature`, `author`
**Members**: Assign ke developer yang bertugas

---

### Template Card untuk Reviewer Pages

**Title**: `[Reviewer] Create Review Assignment Page`

**Description**:
```markdown
**Branch**: `feature/reviewer-pages`
**Developer**: @username

## Task
Buat halaman untuk Reviewer melihat assignments mereka

## Subtasks
- [ ] Create `app/dashboard/reviewer/assignments/page.tsx`
- [ ] Create component `components/reviewer/AssignmentList.tsx`
- [ ] Show pending, in-progress, completed reviews
- [ ] Add action buttons (accept, decline, submit review)
- [ ] Test functionality
- [ ] Create PR

## Files to Create
- `app/dashboard/reviewer/assignments/page.tsx`
- `components/reviewer/AssignmentList.tsx`

## Dependencies
- Needs: Server Actions untuk reviews (perlu dibuat)
- Can reuse: Components dari `components/reviews/`

## Notes
- Filter berdasarkan `reviewer_id` dari user yang login
- Show status: pending, accepted, declined, completed
```

**Labels**: `feature`, `reviewer`
**Members**: Assign ke developer yang bertugas

---

### Template Card untuk Public Pages

**Title**: `[Public] Create Journal Homepage`

**Description**:
```markdown
**Branch**: `feature/public-pages`
**Developer**: @username

## Task
Buat halaman homepage untuk journal (public view)

## Subtasks
- [ ] Update `app/journal/[slug]/page.tsx`
- [ ] Create component `components/journal/JournalHomepage.tsx`
- [ ] Show journal info, latest articles, announcements
- [ ] Add navigation (About, Articles, etc)
- [ ] Test dengan berbagai journal slugs
- [ ] Create PR

## Files to Edit/Create
- `app/journal/[slug]/page.tsx` (update existing)
- `components/journal/JournalHomepage.tsx`

## Dependencies
- Needs: Server Actions dari `actions/journals/get.ts`
- Needs: Server Actions untuk articles (perlu dibuat)

## Notes
- Public page, tidak perlu authentication
- Responsive design penting
- SEO-friendly
```

**Labels**: `feature`, `public`
**Members**: Assign ke developer yang bertugas

---

## 🔄 Workflow dengan Trello

### Daily Workflow

1. **Morning Standup**
   - Lihat cards di **"In Progress"**
   - Update progress di checklist
   - Move cards jika perlu

2. **Mulai Task**
   - Pindahkan card dari **"To Do"** ke **"In Progress"**
   - Update description dengan branch name
   - Set due date jika perlu

3. **Selama Development**
   - Update checklist setiap selesai subtask
   - Comment di card jika ada blocker
   - Link commit/PR di description

4. **Selesai Development**
   - Pindahkan ke **"Review"**
   - Link PR di card description
   - Tag reviewer di comment

5. **Setelah Merge**
   - Pindahkan ke **"Done"**
   - Archive setelah 1-2 minggu

---

## 🔗 Integrasi dengan GitHub

### Manual Linking (Recommended untuk Start)

#### Di Trello Card:
1. Copy link GitHub issue/PR
2. Paste di card description:
   ```
   Related Issue: https://github.com/username/repo/issues/123
   PR: https://github.com/username/repo/pull/456
   ```

#### Di GitHub Commit:
```bash
git commit -m "feat(editor): add submission list

Closes #123
Related Trello: [Editor] Review Submission List Page"
```

#### Di GitHub PR Description:
```markdown
## Related Trello Card
[Editor] Review Submission List Page - [Link ke Trello card]

## Checklist
- [x] Development done
- [x] Testing done
- [ ] Code review pending
```

---

## 📊 Board Views & Filters

### Filter by Label
- Klik label di card untuk filter semua cards dengan label tersebut
- Berguna untuk melihat semua tasks untuk module tertentu

### Filter by Member
- Klik avatar member untuk filter cards yang di-assign ke mereka
- Berguna untuk melihat workload per person

### Calendar View
- Klik **"..."** → **"Power-Ups"** → **"Calendar"**
- Berguna untuk melihat due dates

### Card Templates (Trello Premium)
- Buat template untuk setiap jenis task
- Save waktu saat membuat card baru

---

## 🎨 Best Practices

### ✅ DO:
- **Update setiap hari** - Jangan biarkan card tanpa update > 2 hari
- **Gunakan checklist** - Break down task menjadi subtasks
- **Link PR/Issue** - Memudahkan tracking
- **Comment untuk komunikasi** - Jangan hanya update checklist
- **Set realistic due dates** - Jangan terlalu optimis
- **Archive cards lama** - Keep board clean

### ❌ DON'T:
- **Jangan duplicate cards** - Satu task = satu card
- **Jangan biarkan di "In Progress" terlalu lama** - Max 1-2 minggu
- **Jangan lupa update saat PR merged** - Move ke Done
- **Jangan assign terlalu banyak cards** - Max 3-4 cards per person
- **Jangan skip daily update** - Consistency penting

---

## 📈 Tracking Progress

### Weekly Review
1. Review semua cards di **"Done"** minggu ini
2. Archive cards yang sudah > 1 minggu di Done
3. Review cards di **"In Progress"** - apakah ada yang stuck?
4. Move cards dari **"Backlog"** ke **"To Do"** untuk sprint berikutnya

### Metrics (Optional)
- Cards completed per week
- Average time in "In Progress"
- Cards blocked
- PRs created from cards

---

## 🚀 Quick Setup Checklist

- [ ] Board "OJS Development" dibuat
- [ ] Lists dibuat: Backlog, To Do, In Progress, Review, Done, Bugs
- [ ] Labels dibuat: feature, bugfix, refactor, editor, author, reviewer, public
- [ ] Team members di-invite
- [ ] Cards dibuat dari tasks di `COLLABORATION_GUIDE.md`
- [ ] Cards di-assign ke team members
- [ ] Due dates di-set (jika ada)
- [ ] Workflow dijelaskan ke team

---

## 📞 Support

Jika ada pertanyaan tentang Trello:
- **Trello Help**: https://help.trello.com
- **Trello Templates**: https://trello.com/templates
- **Team Lead** - Tanya untuk setup atau workflow

---

**Happy Organizing! 📋✨**

