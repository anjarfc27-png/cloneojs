/**
 * Script to check user role in database
 * Run: npx tsx scripts/check-user-role.ts anjarbdn@gmail.com
 */

// Load environment variables from .env.local FIRST, before any imports
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const result = config({ path: envPath })
  if (result.error) {
    console.warn('⚠️  Warning: Could not load .env.local:', result.error.message)
  } else {
    console.log('✅ Loaded .env.local')
  }
} else {
  console.warn('⚠️  Warning: .env.local not found at:', envPath)
  console.warn('   Trying to load from process.env...')
}

// Now import after env vars are loaded
import { createAdminClient } from '../lib/db/supabase-admin'

async function checkUserRole(email: string) {
  try {
    console.log(`\n🔍 Checking role for: ${email}\n`)
    
    const adminClient = createAdminClient()

    // 1. Find user by email
    console.log('📋 Step 1: Finding user in auth...')
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error listing users:', authError.message)
      process.exit(1)
    }

    const user = authUsers.users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ User not found: ${email}`)
      console.log(`\n📊 Total users in auth: ${authUsers.users.length}`)
      process.exit(1)
    }

    console.log(`✅ User found:`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Created: ${user.created_at}`)
    console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`)
    console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)

    // 2. Check roles table
    console.log('\n📋 Step 2: Checking super_admin role...')
    const { data: superAdminRole, error: roleError } = await adminClient
      .from('roles')
      .select('id, role_key, name')
      .eq('role_key', 'super_admin')
      .limit(1)
      .maybeSingle()

    if (roleError) {
      console.error('❌ Error querying roles:', roleError.message)
      process.exit(1)
    }

    if (!superAdminRole) {
      console.error('❌ super_admin role not found in roles table!')
      process.exit(1)
    }

    console.log(`✅ Super Admin Role found:`)
    console.log(`   ID: ${superAdminRole.id}`)
    console.log(`   Key: ${superAdminRole.role_key}`)
    console.log(`   Name: ${superAdminRole.name}`)

    // 3. Check user_role_assignments
    console.log('\n📋 Step 3: Checking user_role_assignments...')
    const { data: roleAssignments, error: assignmentError } = await adminClient
      .from('user_role_assignments')
      .select('id, user_id, role_id, tenant_id, journal_id, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('role_id', superAdminRole.id)
      .eq('is_active', true)

    if (assignmentError) {
      console.error('❌ Error querying user_role_assignments:', assignmentError.message)
      process.exit(1)
    }

    console.log(`📊 Role Assignments: ${roleAssignments?.length || 0} active`)
    if (roleAssignments && roleAssignments.length > 0) {
      roleAssignments.forEach((assignment, idx) => {
        console.log(`   ${idx + 1}. Assignment ID: ${assignment.id}`)
        console.log(`      Tenant ID: ${assignment.tenant_id}`)
        console.log(`      Journal ID: ${assignment.journal_id || 'N/A'}`)
        console.log(`      Created: ${assignment.created_at}`)
      })
    } else {
      console.log('   ⚠️  No active role assignments found!')
    }

    // 4. Check tenant_users (old structure)
    console.log('\n📋 Step 4: Checking tenant_users (old structure)...')
    const { data: tenantUsers, error: tenantError } = await adminClient
      .from('tenant_users')
      .select('id, user_id, tenant_id, role, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)

    if (tenantError) {
      console.error('❌ Error querying tenant_users:', tenantError.message)
      process.exit(1)
    }

    console.log(`📊 Tenant Users: ${tenantUsers?.length || 0} active`)
    if (tenantUsers && tenantUsers.length > 0) {
      tenantUsers.forEach((tu, idx) => {
        console.log(`   ${idx + 1}. Tenant User ID: ${tu.id}`)
        console.log(`      Tenant ID: ${tu.tenant_id}`)
        console.log(`      Role: ${tu.role}`)
        console.log(`      Created: ${tu.created_at}`)
      })
    } else {
      console.log('   ⚠️  No active tenant_users found!')
    }

    // 5. Diagnosis
    console.log('\n📋 Step 5: Diagnosis...')
    const hasSuperAdminRole = !!superAdminRole
    const hasActiveSuperAdminAssignment = (roleAssignments?.length || 0) > 0
    const hasSuperAdminInTenantUsers = (tenantUsers?.length || 0) > 0
    const isSuperAdmin = hasActiveSuperAdminAssignment || hasSuperAdminInTenantUsers

    console.log(`   Has super_admin role definition: ${hasSuperAdminRole ? '✅' : '❌'}`)
    console.log(`   Has active role assignment: ${hasActiveSuperAdminAssignment ? '✅' : '❌'}`)
    console.log(`   Has tenant_users entry: ${hasSuperAdminInTenantUsers ? '✅' : '❌'}`)
    console.log(`   Is Super Admin: ${isSuperAdmin ? '✅ YES' : '❌ NO'}`)

    // 6. Generate fix SQL if needed
    if (!isSuperAdmin) {
      console.log('\n🔧 Fix SQL needed:')
      
      if (!hasActiveSuperAdminAssignment) {
        console.log('\n-- Add role assignment:')
        console.log(`INSERT INTO user_role_assignments (user_id, role_id, tenant_id, is_active)`)
        console.log(`VALUES (`)
        console.log(`  '${user.id}',`)
        console.log(`  '${superAdminRole.id}',`)
        console.log(`  (SELECT id FROM tenants LIMIT 1), -- Replace with actual tenant_id`)
        console.log(`  true`)
        console.log(`);`)
      }

      if (!hasSuperAdminInTenantUsers) {
        console.log('\n-- Add tenant user (old structure):')
        console.log(`INSERT INTO tenant_users (user_id, tenant_id, role, is_active)`)
        console.log(`VALUES (`)
        console.log(`  '${user.id}',`)
        console.log(`  (SELECT id FROM tenants LIMIT 1), -- Replace with actual tenant_id`)
        console.log(`  'super_admin',`)
        console.log(`  true`)
        console.log(`);`)
      }
    } else {
      console.log('\n✅ User is properly configured as super admin!')
    }

    console.log('\n')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

// Get email from command line args
const email = process.argv[2] || 'anjarbdn@gmail.com'
checkUserRole(email)

