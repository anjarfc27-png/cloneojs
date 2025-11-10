# QA Checklist - OJS Next.js Clone

Checklist lengkap untuk Quality Assurance sebelum production deployment.

## Pre-Deployment Checklist

### Environment Setup
- [ ] Semua environment variables sudah di-set
- [ ] Supabase project sudah dibuat dan configured
- [ ] Google Drive API credentials sudah valid
- [ ] Database schema sudah di-deploy
- [ ] RLS policies sudah di-test

### Security
- [ ] `.env.local` tidak di-commit ke Git
- [ ] Service role key tidak exposed ke client
- [ ] RLS policies sudah di-aktifkan
- [ ] Authentication flow sudah di-test
- [ ] Role-based access control sudah di-test
- [ ] File permissions di Google Drive sudah benar

## Functional Testing

### Authentication
- [ ] User bisa register
- [ ] User bisa login
- [ ] User bisa logout
- [ ] Session persist setelah refresh
- [ ] Protected routes redirect ke login
- [ ] Password reset berfungsi (jika diimplementasi)

### Multi-Tenant
- [ ] User bisa terdaftar di multiple tenants
- [ ] Data ter-isolasi per tenant
- [ ] User hanya bisa akses tenant mereka
- [ ] Super admin bisa manage semua tenants

### Author Workflow
- [ ] Author bisa create submission
- [ ] Author bisa upload file (PDF)
- [ ] Author bisa edit draft submission
- [ ] Author bisa submit submission
- [ ] Author bisa lihat status submission
- [ ] Author bisa upload revision
- [ ] Author bisa lihat review comments (jika allowed)

### Editor Workflow
- [ ] Editor bisa lihat semua submissions di journal
- [ ] Editor bisa assign reviewer
- [ ] Editor bisa make editorial decision
- [ ] Editor bisa publish article
- [ ] Editor bisa manage issues
- [ ] Editor bisa manage volumes

### Reviewer Workflow
- [ ] Reviewer bisa lihat assigned reviews
- [ ] Reviewer bisa accept/decline review request
- [ ] Reviewer bisa download submission files
- [ ] Reviewer bisa submit review
- [ ] Reviewer bisa provide recommendation
- [ ] Reviewer bisa upload review files

### Publishing
- [ ] Article bisa dipublish
- [ ] Published article muncul di public site
- [ ] PDF bisa di-view via Google Drive
- [ ] Article metadata (DOI, ORCID) ter-display
- [ ] Article muncul di issue yang benar
- [ ] Citation count ter-update

### Public Site
- [ ] Journal homepage ter-load
- [ ] Published articles ter-list
- [ ] Article detail page ter-load
- [ ] PDF viewer berfungsi
- [ ] Search berfungsi (jika diimplementasi)
- [ ] Issue listing ter-load

## Data Migration Testing

### Migration Script
- [ ] Script bisa connect ke source database
- [ ] Script bisa connect ke Supabase
- [ ] Users ter-migrasi dengan benar
- [ ] Journals ter-migrasi dengan benar
- [ ] Submissions ter-migrasi dengan status yang benar
- [ ] Reviews ter-migrasi
- [ ] Published articles ter-migrasi
- [ ] Issues ter-migrasi
- [ ] File mapping ke Google Drive berfungsi

### Data Integrity
- [ ] Foreign keys ter-validasi
- [ ] No duplicate data
- [ ] All relationships intact
- [ ] ORCID IDs ter-migrasi
- [ ] DOI ter-migrasi
- [ ] Metadata JSONB ter-migrasi

## Performance Testing

### Database
- [ ] Query performance acceptable (< 500ms untuk complex queries)
- [ ] Indexes ter-optimize
- [ ] No N+1 queries
- [ ] Connection pooling berfungsi

### File Upload
- [ ] File upload ke Google Drive < 30s untuk file < 10MB
- [ ] Progress indicator berfungsi
- [ ] Error handling untuk failed uploads
- [ ] File size validation

### Page Load
- [ ] Homepage load < 2s
- [ ] Dashboard load < 3s
- [ ] Article page load < 2s
- [ ] PDF viewer load < 5s

## Browser Compatibility

### Desktop
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive design berfungsi
- [ ] Touch interactions berfungsi

## UI/UX Testing

### Design Consistency
- [ ] UI konsisten di semua pages
- [ ] Colors sesuai design system
- [ ] Typography konsisten
- [ ] Spacing konsisten
- [ ] Icons ter-display dengan benar

### Accessibility
- [ ] Keyboard navigation berfungsi
- [ ] Screen reader compatible (basic)
- [ ] Color contrast memenuhi WCAG AA
- [ ] Form labels ter-attach dengan benar
- [ ] Error messages jelas

### User Experience
- [ ] Navigation intuitive
- [ ] Error messages helpful
- [ ] Loading states ter-display
- [ ] Success feedback jelas
- [ ] Forms user-friendly

## Integration Testing

### Supabase
- [ ] Database connection stable
- [ ] Auth flow berfungsi
- [ ] RLS policies bekerja
- [ ] Real-time subscriptions (jika digunakan)

### Google Drive
- [ ] File upload berfungsi
- [ ] File permissions ter-set dengan benar
- [ ] webViewLink ter-generate
- [ ] PDF viewer berfungsi
- [ ] Error handling untuk API failures

### API Routes
- [ ] All API routes ter-test
- [ ] Error handling proper
- [ ] Response format konsisten
- [ ] Authentication required routes protected

## End-to-End Testing

### Complete Workflow
1. [ ] Author register → login → create submission → submit
2. [ ] Editor login → assign reviewer → make decision
3. [ ] Reviewer login → accept review → complete review
4. [ ] Editor publish article → article muncul di public site
5. [ ] Public user view article → PDF ter-load

### Edge Cases
- [ ] Multiple authors di satu submission
- [ ] Multiple review rounds
- [ ] Revision request → author upload revision
- [ ] Article retraction
- [ ] Issue dengan multiple articles

## Documentation

- [ ] README lengkap dan jelas
- [ ] SETUP.md ter-update
- [ ] MIGRATION.md lengkap
- [ ] ARCHITECTURE.md menjelaskan sistem
- [ ] Code comments adequate
- [ ] API documentation (jika ada)

## Deployment

### Vercel
- [ ] Build berhasil
- [ ] Environment variables ter-set
- [ ] Domain ter-configure
- [ ] SSL certificate valid
- [ ] Custom domain redirect berfungsi

### Post-Deployment
- [ ] Site ter-akses
- [ ] Database connection berfungsi
- [ ] File upload berfungsi
- [ ] Email notifications berfungsi (jika ada)
- [ ] Monitoring setup (optional)

## Regression Testing

Setelah setiap major change:
- [ ] Semua core workflows masih berfungsi
- [ ] No breaking changes
- [ ] Performance tidak menurun
- [ ] UI tidak broken

## Sign-off

- [ ] All critical bugs fixed
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation complete
- [ ] Ready for production

**Tester:** _________________ **Date:** _________________

**Approved by:** _________________ **Date:** _________________

