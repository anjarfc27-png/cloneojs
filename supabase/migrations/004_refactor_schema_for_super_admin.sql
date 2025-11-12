-- ============================================
-- REFACTOR SCHEMA FOR SUPER ADMIN (OJS 3.3)
-- ============================================
-- 
-- This migration refactors the database schema to match OJS PKP 3.3 structure
-- with proper separation of site-level, journal-level, and workflow-level data.
--
-- IMPORTANT: This is a major refactoring. Backup your database before running.
--

-- ============================================
-- 0. ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE SITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create default site if it doesn't exist
INSERT INTO sites (name, slug, description)
SELECT 'OJS Platform', 'default', 'Default OJS Platform Site'
WHERE NOT EXISTS (SELECT 1 FROM sites WHERE slug = 'default');

-- ============================================
-- 2. CREATE ROLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_site_level BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default OJS roles
INSERT INTO roles (role_key, name, description, is_site_level) VALUES
  ('super_admin', 'Super Admin', 'Full system access', true),
  ('site_admin', 'Site Admin', 'Site-level administration', true),
  ('journal_manager', 'Journal Manager', 'Manage a journal', false),
  ('editor', 'Editor', 'Edit and manage submissions', false),
  ('section_editor', 'Section Editor', 'Edit and manage section submissions', false),
  ('reviewer', 'Reviewer', 'Review submissions', false),
  ('author', 'Author', 'Submit articles', false),
  ('reader', 'Reader', 'Read published articles', false),
  ('copyeditor', 'Copyeditor', 'Copyedit articles', false),
  ('proofreader', 'Proofreader', 'Proofread articles', false),
  ('production_editor', 'Production Editor', 'Manage production', false),
  ('subscription_manager', 'Subscription Manager', 'Manage subscriptions', false)
ON CONFLICT (role_key) DO NOTHING;

-- ============================================
-- 3. CREATE PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default permissions
INSERT INTO permissions (permission_key, description) VALUES
  ('manage_site_settings', 'Manage site settings'),
  ('manage_journals', 'Manage journals'),
  ('manage_users', 'Manage users'),
  ('manage_plugins', 'Manage plugins'),
  ('manage_locale', 'Manage languages'),
  ('manage_navigation', 'Manage navigation'),
  ('manage_announcements', 'Manage announcements'),
  ('read_statistics', 'Read statistics'),
  ('read_logs', 'Read audit logs'),
  ('manage_security', 'Manage security settings'),
  ('manage_schedulers', 'Manage schedulers')
ON CONFLICT (permission_key) DO NOTHING;

-- ============================================
-- 4. CREATE ROLE_PERMISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Grant all permissions to super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'super_admin'
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CREATE USER_ROLE_ASSIGNMENTS TABLE
-- ============================================
-- This replaces tenant_users with a more flexible structure

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id, journal_id, tenant_id)
);

-- Migrate data from tenant_users to user_role_assignments
-- This preserves existing user-role assignments
INSERT INTO user_role_assignments (user_id, role_id, tenant_id, is_active, created_at, updated_at)
SELECT 
  tu.user_id,
  r.id as role_id,
  tu.tenant_id,
  tu.is_active,
  tu.created_at,
  tu.updated_at
FROM tenant_users tu
LEFT JOIN roles r ON r.role_key = tu.role::text
WHERE r.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. UPDATE JOURNALS TABLE
-- ============================================
-- Ensure journals table has all necessary fields

ALTER TABLE journals
  ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS path VARCHAR(255),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Set default site_id for existing journals
UPDATE journals
SET site_id = (SELECT id FROM sites WHERE slug = 'default' LIMIT 1)
WHERE site_id IS NULL;

-- Create index on path for fast lookups
CREATE INDEX IF NOT EXISTS idx_journals_path ON journals(path);
CREATE INDEX IF NOT EXISTS idx_journals_site_id ON journals(site_id);
CREATE INDEX IF NOT EXISTS idx_journals_status ON journals(status);

-- ============================================
-- 7. CREATE/UPDATE ACTIVITY_LOGS TABLE
-- ============================================
-- Ensure activity_logs table exists and matches the new structure

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns if they don't exist
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update user_id to actor_id if needed (only if actor_id column was just created)
DO $$
BEGIN
  -- Only update if actor_id is NULL and user_id exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_logs' 
    AND column_name = 'actor_id'
  ) THEN
    UPDATE activity_logs
    SET actor_id = user_id
    WHERE actor_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 8. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_journal_id ON user_role_assignments(journal_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_tenant_id ON user_role_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(is_active);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(
  p_user_id UUID,
  p_role_key VARCHAR,
  p_journal_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN roles r ON r.id = ura.role_id
    WHERE ura.user_id = p_user_id
      AND r.role_key = p_role_key
      AND ura.is_active = true
      AND (p_journal_id IS NULL OR ura.journal_id = p_journal_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION user_is_super_admin(p_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_has_role(p_user_id, 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. UPDATE RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on activity_logs if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Sites: Super admin can read/write all, others read-only
CREATE POLICY "super_admin_full_access_sites" ON sites
  FOR ALL
  TO authenticated
  USING (user_is_super_admin(auth.uid()));

CREATE POLICY "authenticated_read_sites" ON sites
  FOR SELECT
  TO authenticated
  USING (true);

-- Roles: Everyone can read, only super admin can modify
CREATE POLICY "super_admin_full_access_roles" ON roles
  FOR ALL
  TO authenticated
  USING (user_is_super_admin(auth.uid()));

CREATE POLICY "authenticated_read_roles" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Permissions: Everyone can read, only super admin can modify
CREATE POLICY "super_admin_full_access_permissions" ON permissions
  FOR ALL
  TO authenticated
  USING (user_is_super_admin(auth.uid()));

CREATE POLICY "authenticated_read_permissions" ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Role Permissions: Everyone can read, only super admin can modify
CREATE POLICY "super_admin_full_access_role_permissions" ON role_permissions
  FOR ALL
  TO authenticated
  USING (user_is_super_admin(auth.uid()));

CREATE POLICY "authenticated_read_role_permissions" ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- User Role Assignments: Users can read their own, super admin can read/write all
CREATE POLICY "super_admin_full_access_user_roles" ON user_role_assignments
  FOR ALL
  TO authenticated
  USING (user_is_super_admin(auth.uid()));

CREATE POLICY "users_read_own_roles" ON user_role_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Activity Logs: Only super admin can read
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "super_admin_read_activity_logs" ON activity_logs;
    DROP POLICY IF EXISTS "super_admin_write_activity_logs" ON activity_logs;
    
    -- Create new policies
    CREATE POLICY "super_admin_read_activity_logs" ON activity_logs
      FOR SELECT
      TO authenticated
      USING (user_is_super_admin(auth.uid()));
    
    CREATE POLICY "super_admin_write_activity_logs" ON activity_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (user_is_super_admin(auth.uid()));
  END IF;
END $$;

-- ============================================
-- 11. CREATE TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_role_assignments_updated_at
  BEFORE UPDATE ON user_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. COMMENTS
-- ============================================

COMMENT ON TABLE sites IS 'Site-level configuration (typically one row)';
COMMENT ON TABLE roles IS 'Role definitions for the system';
COMMENT ON TABLE permissions IS 'Granular permissions for role-based access control';
COMMENT ON TABLE role_permissions IS 'Many-to-many mapping of roles to permissions';
COMMENT ON TABLE user_role_assignments IS 'User role assignments with optional journal/tenant scope';

-- ============================================
-- END OF MIGRATION
-- ============================================

