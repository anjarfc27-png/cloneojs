# Admin Schema Setup

File ini berisi schema database untuk fitur-fitur Super Admin OJS PKP 3.3.

## Setup

1. **Jalankan schema-admin.sql di Supabase SQL Editor:**

   ```sql
   -- Copy isi dari schema-admin.sql dan jalankan di Supabase SQL Editor
   ```

2. **Tabel-tabel yang dibuat:**
   - `site_settings` - Pengaturan situs
   - `activity_logs` - Log aktivitas sistem
   - `email_templates` - Template email
   - `announcements` - Pengumuman situs
   - `api_keys` - API keys management
   - `system_tasks` - Scheduled tasks
   - `task_logs` - Task execution logs
   - `navigation_menus` - Navigation menu management
   - `system_statistics` - System statistics cache

3. **RLS Policies:**
   - Semua tabel sudah memiliki RLS policies
   - Hanya super admin yang bisa mengakses dan mengelola data

4. **Default Data:**
   - Site settings default sudah di-insert
   - Email templates default sudah di-insert
   - System tasks default sudah di-insert

## Fitur yang Tersedia

### 1. Site Settings
- General settings (site title, description, contact info)
- Email settings (SMTP configuration)
- Security settings (password policies, session timeout)
- Appearance settings (theme, logo, favicon)

### 2. System Information
- Server information
- Database information
- Memory usage
- System health

### 3. Activity Logs
- System activity logging
- User activity tracking
- Audit trail
- Filtering and search

### 4. Email Templates
- Email template management
- Edit email templates
- Enable/disable templates

### 5. Announcements
- Site-wide announcements
- Announcement management
- Expiration dates
- Multiple types (info, warning, success, error)

### 6. Statistics & Reports
- User statistics
- Journal statistics
- Content statistics
- Submissions by status
- Period-based statistics

## API Endpoints

### Settings
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings
- `POST /api/admin/settings` - Create/update single setting

### System Information
- `GET /api/admin/system/information` - Get system information

### Activity Logs
- `GET /api/admin/activity-logs` - Get activity logs (with pagination and filters)
- `DELETE /api/admin/activity-logs` - Delete old logs

### Email Templates
- `GET /api/admin/email-templates` - Get all email templates
- `GET /api/admin/email-templates/[id]` - Get single email template
- `PUT /api/admin/email-templates/[id]` - Update email template

### Announcements
- `GET /api/admin/announcements` - Get all announcements
- `POST /api/admin/announcements` - Create announcement
- `GET /api/admin/announcements/[id]` - Get single announcement
- `PUT /api/admin/announcements/[id]` - Update announcement
- `DELETE /api/admin/announcements/[id]` - Delete announcement

### Statistics
- `GET /api/admin/statistics` - Get system statistics

## Halaman Admin

### 1. Dashboard (`/admin/dashboard`)
- Statistik sistem
- Aktivitas terkini
- Overview sistem

### 2. Settings (`/admin/settings`)
- General settings
- Email settings
- Security settings
- Appearance settings

### 3. System Information (`/admin/system/information`)
- Server information
- Database information
- Memory usage
- System health

### 4. Activity Log (`/admin/activity-log`)
- View activity logs
- Filter logs
- Delete old logs

### 5. Email Templates (`/admin/email-templates`)
- Manage email templates
- Edit templates
- Enable/disable templates

### 6. Announcements (`/admin/announcements`)
- Manage announcements
- Create/edit/delete announcements
- Enable/disable announcements

### 7. Statistics & Reports (`/admin/statistics`)
- View system statistics
- User statistics
- Journal statistics
- Content statistics

## Notes

- Semua fitur memerlukan super admin role
- RLS policies sudah dikonfigurasi untuk keamanan
- Activity logging otomatis untuk beberapa aksi penting
- Email templates menggunakan variable substitution ({{variable_name}})



