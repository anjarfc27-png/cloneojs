# RENCANA IMPLEMENTASI SISTEMATIS - OJS PKP 3.3 COMPLIANCE

## 📋 OVERVIEW

Dokumen ini berisi rencana implementasi sistematis untuk mencapai 100% compliance dengan 9 kriteria OJS PKP 3.3.

**Target Progress:** 48% → 100%
**Estimated Time:** 4-6 minggu
**Priority:** High

---

## 🎯 PRIORITAS IMPLEMENTASI

### Phase 1: CRITICAL FEATURES (Minggu 1-2)
1. ✅ Crossref API Integration untuk DOI Auto-Registration
2. ✅ Full-Text Search System
3. ✅ SEO & Google Scholar Metadata
4. ✅ Editorial Workflow Lengkap

### Phase 2: IMPORTANT FEATURES (Minggu 3-4)
5. ✅ Metadata Fields Lengkap
6. ✅ Migration Script Improvement
7. ✅ Security Enhancements

### Phase 3: ENHANCEMENTS (Minggu 5-6)
8. ✅ Enhanced Reporting Tools
9. ✅ Email Notifications System
10. ✅ Advanced Features

---

## 📝 DETAILED IMPLEMENTATION PLAN

### PHASE 1: CRITICAL FEATURES

#### 1.1 Crossref API Integration untuk DOI Auto-Registration

**Status:** 30% → Target 100%
**Priority:** HIGH
**Estimated Time:** 3-4 hari

##### Task Breakdown:

**1.1.1 Setup Crossref API Client**
- [x] Install Crossref API library (`crossref-commons` atau custom client)
- [x] Create `lib/crossref/client.ts` untuk Crossref API client
- [x] Implement authentication (username, password untuk Crossref)
- [x] Create API wrapper functions:
  - `registerDOI()` - Register DOI ke Crossref
  - `updateDOI()` - Update DOI metadata
  - `getDOIStatus()` - Check DOI registration status
  - `validateDOI()` - Validate DOI format

**1.1.2 Database Schema Updates**
- [x] Update `doi_registrations` table:
  - Add `crossref_deposit_id` field
  - Add `crossref_response` JSONB field
  - Add `retry_count` field
  - Add `last_attempt` timestamp
- [x] Create migration script untuk update schema

**1.1.3 API Routes**
- [x] Create `/api/admin/crossref/register` - Manual DOI registration
- [x] Create `/api/admin/crossref/status/[doi]` - Check DOI status
- [x] Create `/api/admin/crossref/update/[doi]` - Update DOI metadata
- [x] Update `/api/submissions/[id]/publish` untuk auto-register DOI

**1.1.4 Background Jobs**
- [x] Create scheduled task untuk retry failed DOI registrations
- [x] Create scheduled task untuk sync DOI status
- [x] Implement queue system untuk DOI registration

**1.1.5 UI Components**
- [x] Create `/admin/crossref` page untuk manage DOI registrations
- [x] Add DOI status indicator di article page
- [x] Add DOI registration form di publish article form
- [x] Add DOI management di admin dashboard

**1.1.6 Configuration**
- [x] Add Crossref credentials ke environment variables
- [x] Add Crossref settings ke site_settings
- [x] Create configuration page untuk Crossref settings

---

#### 1.2 Full-Text Search System

**Status:** 0% → Target 100%
**Priority:** HIGH
**Estimated Time:** 4-5 hari

##### Task Breakdown:

**1.2.1 Database Setup**
- [x] Enable PostgreSQL full-text search extension
- [x] Create search index pada articles table
- [x] Create search index pada submissions table
- [x] Create materialized view untuk search optimization

**1.2.2 Search API**
- [x] Create `/api/search` endpoint
- [x] Create `/api/search/suggestions` untuk autocomplete
- [x] Create `/api/search/advanced` untuk advanced search

**1.2.3 Search Functions**
- [x] Create `lib/search/search.ts` untuk search logic
- [x] Implement full-text search dengan PostgreSQL
- [x] Implement fuzzy search untuk typo tolerance
- [x] Implement search ranking algorithm
- [x] Implement search filters (journal, author, date, etc.)

**1.2.4 UI Components**
- [x] Update `components/shared/SearchBar.tsx` dengan autocomplete
- [x] Create `/search` page untuk search results
- [x] Create `components/search/SearchResults.tsx`
- [x] Create `components/search/SearchFilters.tsx`
- [x] Create `components/search/AdvancedSearchForm.tsx`

**1.2.5 Search Indexing**
- [x] Create scheduled task untuk update search index
- [x] Create function untuk index new articles
- [x] Create function untuk reindex all articles
- [x] Create admin page untuk manage search index

---

#### 1.3 SEO & Google Scholar Metadata

**Status:** 20% → Target 100%
**Priority:** HIGH
**Estimated Time:** 3-4 hari

##### Task Breakdown:

**1.3.1 Metadata Generation**
- [x] Create `lib/seo/metadata.ts` untuk generate metadata
- [x] Implement Google Scholar metadata
- [x] Implement Open Graph tags
- [x] Implement Twitter Cards
- [x] Implement Schema.org structured data

**1.3.2 Dynamic Metadata**
- [x] Update `app/article/[id]/page.tsx` untuk generate dynamic metadata
- [x] Update `app/[journalSlug]/page.tsx` untuk generate journal metadata
- [x] Update `app/[journalSlug]/issue/[issueId]/page.tsx` untuk issue metadata
- [x] Create `app/article/[id]/metadata.ts` untuk article metadata

**1.3.3 Sitemap & Robots**
- [x] Create `/sitemap.xml` untuk articles, journals, issues
- [x] Create `/robots.txt` dengan proper rules
- [x] Create dynamic sitemap generation
- [x] Create sitemap index untuk large datasets

**1.3.4 Canonical URLs**
- [x] Implement canonical URLs untuk semua pages
- [x] Prevent duplicate content issues
- [x] Add canonical tag di layout

---

#### 1.4 Editorial Workflow Lengkap

**Status:** 50% → Target 100%
**Priority:** HIGH
**Estimated Time:** 5-6 hari

##### Task Breakdown:

**1.4.1 Workflow States**
- [x] Implement complete workflow states
- [x] Add workflow state machine validation
- [x] Add workflow history tracking

**1.4.2 Editor Assignment**
- [x] Create editor assignment system
- [x] Create `/api/submissions/[id]/assign-editor` endpoint
- [x] Create UI untuk assign editor
- [x] Create editor dashboard untuk assigned submissions

**1.4.3 Review Process**
- [x] Implement multiple review rounds
- [x] Implement review assignment dengan due dates
- [x] Implement review reminders
- [x] Implement review decision workflow
- [x] Create review form dengan criteria

**1.4.4 Revision Process**
- [x] Implement revision request system
- [x] Create revision submission workflow
- [x] Create revision comparison view
- [x] Implement revision tracking

**1.4.5 Production Stage**
- [x] Create production stage setelah acceptance
- [x] Implement copyediting workflow
- [x] Implement layout editing
- [x] Implement proofreading
- [x] Create production dashboard

**1.4.6 Editorial Dashboard**
- [x] Create comprehensive editorial dashboard
- [x] Add submission queue dengan filters
- [x] Add editorial calendar
- [x] Add task assignment system
- [x] Add workflow statistics
- [x] Add email notifications

---

## 📊 IMPLEMENTATION TIMELINE

### Week 1-2: Phase 1 (Critical Features)
- Day 1-4: Crossref API Integration
- Day 5-9: Full-Text Search System
- Day 10-13: SEO & Google Scholar Metadata
- Day 14-19: Editorial Workflow Lengkap

---

## ✅ CHECKLIST

### Phase 1: Critical Features
- [x] Crossref API Integration
- [x] Full-Text Search System
- [x] SEO & Google Scholar Metadata
- [x] Editorial Workflow Lengkap

---

**Last Updated:** 2025-11-10
**Status:** 🚀 Implementation In Progress
**Version:** 1.0.0
