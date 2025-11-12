-- ============================================
-- VERIFICATION QUERIES FOR MIGRATION 004
-- ============================================
-- Run these queries to verify migration was successful

-- 1. Check if activity_logs table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_logs'
ORDER BY ordinal_position;

-- 2. Check if actor_id column exists in activity_logs
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
AND column_name = 'actor_id';

-- 3. Check if RLS policies exist for activity_logs
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'activity_logs';

-- 4. Check if sites table exists and has data
SELECT * FROM sites;

-- 5. Check if roles table exists and has all default roles
SELECT role_key, name, is_site_level 
FROM roles 
ORDER BY is_site_level DESC, role_key;

-- 6. Check if permissions table exists and has all default permissions
SELECT permission_key, description 
FROM permissions 
ORDER BY permission_key;

-- 7. Check if role_permissions table has mappings
SELECT 
    r.role_key,
    p.permission_key
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
ORDER BY r.role_key, p.permission_key;

-- 8. Check if user_role_assignments table exists and has migrated data
SELECT COUNT(*) as total_assignments FROM user_role_assignments;

-- 9. Check user_role_assignments data details
SELECT 
    ura.id,
    ura.user_id,
    r.role_key,
    ura.journal_id,
    ura.tenant_id,
    ura.is_active,
    ura.created_at
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id
ORDER BY ura.created_at DESC;

-- 10. Check if journals table has site_id column
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'journals' 
AND column_name IN ('site_id', 'path', 'status')
ORDER BY column_name;

-- 11. Check if journals have site_id set
SELECT 
    j.id,
    j.title,
    j.site_id,
    s.name as site_name,
    j.path,
    j.status
FROM journals j
LEFT JOIN sites s ON s.id = j.site_id
LIMIT 10;

-- 12. Check if helper functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('user_has_role', 'user_is_super_admin')
ORDER BY routine_name;

-- 13. Check if indexes exist
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('sites', 'roles', 'permissions', 'user_role_assignments', 'activity_logs')
ORDER BY tablename, indexname;

-- 14. Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('sites', 'roles', 'user_role_assignments')
ORDER BY event_object_table, trigger_name;

-- 15. Test user_is_super_admin function (replace with actual user_id)
-- SELECT user_is_super_admin('your-user-id-here'::uuid);

-- 16. Check RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('sites', 'roles', 'permissions', 'role_permissions', 'user_role_assignments', 'activity_logs')
ORDER BY tablename;



