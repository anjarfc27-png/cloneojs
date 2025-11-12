-- ============================================
-- ADMIN FEATURES SCHEMA FOR OJS PKP 3.3 COMPATIBILITY
-- ============================================

-- Table: site_settings (Site-wide settings)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_name VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  setting_group VARCHAR(100) DEFAULT 'general', -- 'general', 'email', 'security', 'appearance', 'localization'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: activity_logs (System activity logging)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100), -- 'user', 'journal', 'submission', 'article', 'settings', etc.
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: email_templates (Email template management)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject TEXT,
  body TEXT,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  can_disable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: announcements (Site-wide announcements)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  enabled BOOLEAN DEFAULT true,
  date_posted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_expire TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: api_keys (API key management)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name VARCHAR(255) NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{}',
  last_used TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: system_tasks (Scheduled tasks)
CREATE TABLE IF NOT EXISTS system_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name VARCHAR(255) UNIQUE NOT NULL,
  task_class VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  run_interval INTEGER DEFAULT 86400, -- seconds
  last_status VARCHAR(50), -- 'success', 'error', 'running'
  last_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: task_logs (Task execution logs)
CREATE TABLE IF NOT EXISTS task_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES system_tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'warning'
  message TEXT,
  execution_time INTEGER, -- milliseconds
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: navigation_menus (Navigation menu management)
CREATE TABLE IF NOT EXISTS navigation_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  url TEXT,
  menu_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'journal', 'article', 'issue'
  parent_id UUID REFERENCES navigation_menus(id) ON DELETE CASCADE,
  sequence INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  target_blank BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: system_statistics (System statistics cache)
CREATE TABLE IF NOT EXISTS system_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_key VARCHAR(255) UNIQUE NOT NULL,
  stat_value JSONB NOT NULL,
  stat_type VARCHAR(50) DEFAULT 'counter', -- 'counter', 'gauge', 'histogram'
  period VARCHAR(50) DEFAULT 'all', -- 'all', 'day', 'week', 'month', 'year'
  period_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_group ON site_settings(setting_group);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(key);
CREATE INDEX IF NOT EXISTS idx_announcements_enabled ON announcements(enabled);
CREATE INDEX IF NOT EXISTS idx_announcements_date_posted ON announcements(date_posted DESC);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_system_tasks_enabled ON system_tasks(enabled);
CREATE INDEX IF NOT EXISTS idx_system_tasks_next_run ON system_tasks(next_run);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_parent_id ON navigation_menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_sequence ON navigation_menus(sequence);
CREATE INDEX IF NOT EXISTS idx_system_statistics_key ON system_statistics(stat_key);
CREATE INDEX IF NOT EXISTS idx_system_statistics_period ON system_statistics(period, period_date);

-- RLS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_statistics ENABLE ROW LEVEL SECURITY;

-- Super admin can manage all site settings
CREATE POLICY "Super admin can manage site settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Super admin can view all activity logs
CREATE POLICY "Super admin can view activity logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Super admin can manage email templates
CREATE POLICY "Super admin can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Public can view enabled announcements
CREATE POLICY "Public can view enabled announcements" ON announcements
  FOR SELECT USING (enabled = true AND (date_expire IS NULL OR date_expire > NOW()));

-- Super admin can manage announcements
CREATE POLICY "Super admin can manage announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (user_id = auth.uid());

-- Users can manage their own API keys
CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (user_id = auth.uid());

-- Super admin can view all API keys
CREATE POLICY "Super admin can view all API keys" ON api_keys
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Super admin can manage system tasks
CREATE POLICY "Super admin can manage system tasks" ON system_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Super admin can view task logs
CREATE POLICY "Super admin can view task logs" ON task_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Public can view enabled navigation menus
CREATE POLICY "Public can view enabled navigation menus" ON navigation_menus
  FOR SELECT USING (enabled = true);

-- Super admin can manage navigation menus
CREATE POLICY "Super admin can manage navigation menus" ON navigation_menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Super admin can manage system statistics
CREATE POLICY "Super admin can manage system statistics" ON system_statistics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'super_admin'
      AND tenant_users.is_active = true
    )
  );

-- Insert default site settings
INSERT INTO site_settings (setting_name, setting_value, setting_type, setting_group, description)
VALUES 
  ('site_title', 'OJS Multi-Tenant System', 'string', 'general', 'Site title'),
  ('site_description', 'Open Journal Systems Multi-Tenant dengan Next.js', 'string', 'general', 'Site description'),
  ('site_contact_name', 'Administrator', 'string', 'general', 'Site contact name'),
  ('site_contact_email', 'admin@example.com', 'string', 'general', 'Site contact email'),
  ('maintenance_mode', 'false', 'boolean', 'general', 'Maintenance mode'),
  ('session_timeout', '3600', 'number', 'security', 'Session timeout in seconds'),
  ('password_min_length', '8', 'number', 'security', 'Minimum password length'),
  ('password_require_uppercase', 'true', 'boolean', 'security', 'Require uppercase in password'),
  ('password_require_lowercase', 'true', 'boolean', 'security', 'Require lowercase in password'),
  ('password_require_number', 'true', 'boolean', 'security', 'Require number in password'),
  ('password_require_special', 'false', 'boolean', 'security', 'Require special character in password'),
  ('smtp_enabled', 'false', 'boolean', 'email', 'Enable SMTP'),
  ('smtp_host', '', 'string', 'email', 'SMTP host'),
  ('smtp_port', '587', 'number', 'email', 'SMTP port'),
  ('smtp_username', '', 'string', 'email', 'SMTP username'),
  ('smtp_password', '', 'string', 'email', 'SMTP password'),
  ('smtp_encryption', 'tls', 'string', 'email', 'SMTP encryption (tls/ssl)'),
  ('default_language', 'id', 'string', 'localization', 'Default language'),
  ('supported_languages', '["id", "en"]', 'json', 'localization', 'Supported languages'),
  ('theme', 'default', 'string', 'appearance', 'Site theme'),
  ('logo_url', '', 'string', 'appearance', 'Site logo URL'),
  ('favicon_url', '', 'string', 'appearance', 'Site favicon URL')
ON CONFLICT (setting_name) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (key, name, subject, body, description, enabled, can_disable)
VALUES 
  ('user_welcome', 'Welcome Email', 'Welcome to {{site_title}}', 'Welcome {{user_name}} to {{site_title}}!', 'Email sent to new users', true, false),
  ('password_reset', 'Password Reset', 'Reset your password', 'Click here to reset your password: {{reset_link}}', 'Password reset email', true, false),
  ('submission_received', 'Submission Received', 'Your submission has been received', 'Your submission "{{submission_title}}" has been received.', 'Submission received notification', true, true),
  ('review_assigned', 'Review Assigned', 'You have been assigned to review', 'You have been assigned to review "{{submission_title}}".', 'Review assignment notification', true, true),
  ('review_completed', 'Review Completed', 'Review has been completed', 'Review for "{{submission_title}}" has been completed.', 'Review completion notification', true, true),
  ('article_published', 'Article Published', 'Your article has been published', 'Your article "{{article_title}}" has been published.', 'Article publication notification', true, true)
ON CONFLICT (key) DO NOTHING;

-- Insert default system tasks
INSERT INTO system_tasks (task_name, task_class, enabled, run_interval, last_status)
VALUES 
  ('clear_cache', 'ClearCacheTask', true, 3600, 'success'),
  ('send_queued_emails', 'SendQueuedEmailsTask', true, 300, 'success'),
  ('update_statistics', 'UpdateStatisticsTask', true, 3600, 'success'),
  ('cleanup_old_logs', 'CleanupOldLogsTask', true, 86400, 'success')
ON CONFLICT (task_name) DO NOTHING;



