/**
 * Migration Script: OJS (MySQL/Postgres) ke Supabase
 * 
 * Script ini mengimpor data dari database OJS PKP ke Supabase
 * 
 * Usage:
 *   npm run migrate -- --source=mysql --host=localhost --database=ojs --user=root --password=pass
 *   npm run migrate -- --source=postgres --host=localhost --database=ojs --user=postgres --password=pass
 */

import { createClient } from '@supabase/supabase-js'
import mysql from 'mysql2/promise'
import pg from 'pg'

interface MigrationConfig {
  source: 'mysql' | 'postgres'
  host: string
  database: string
  user: string
  password: string
  port?: number
  supabaseUrl: string
  supabaseKey: string
  googleDriveFolderId?: string
}

interface OJSUser {
  user_id: number
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
  orcid?: string
}

interface OJSJournal {
  journal_id: number
  path: string
  primary_locale: string
  enabled: number
}

interface OJSSubmission {
  submission_id: number
  context_id: number
  status: number
  submission_progress: number
  current_round: number
  submission_date: Date
}

/**
 * Transform OJS status ke status baru
 */
function transformSubmissionStatus(ojsStatus: number): string {
  const statusMap: Record<number, string> = {
    1: 'draft', // STATUS_INCOMPLETE
    3: 'submitted', // STATUS_QUEUED
    4: 'under_review', // STATUS_REVIEW
    5: 'under_review', // STATUS_REVIEW
    6: 'accepted', // STATUS_ACCEPTED
    7: 'declined', // STATUS_DECLINED
    8: 'published', // STATUS_PUBLISHED
  }
  return statusMap[ojsStatus] || 'draft'
}

/**
 * Migrate users dari OJS ke Supabase
 */
async function migrateUsers(
  sourceDb: any,
  supabase: any,
  sourceType: 'mysql' | 'postgres'
): Promise<Map<number, string>> {
  console.log('Migrating users...')
  const userMap = new Map<number, string>()

  let users: OJSUser[]
  if (sourceType === 'mysql') {
    const [rows] = await sourceDb.execute(`
      SELECT user_id, username, email, password, first_name, last_name
      FROM users
    `)
    users = rows as OJSUser[]
  } else {
    const result = await sourceDb.query(`
      SELECT user_id, username, email, password, first_name, last_name
      FROM users
    `)
    users = result.rows as OJSUser[]
  }

  for (const user of users) {
    try {
      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password, // Note: OJS uses bcrypt, may need to reset
        email_confirm: true,
        user_metadata: {
          username: user.username,
          first_name: user.first_name || '',
          last_name: user.last_name || '',
        },
      })

      if (authError) {
        console.error(`Error creating user ${user.email}:`, authError.message)
        continue
      }

      if (authUser?.user) {
        userMap.set(user.user_id, authUser.user.id)
        console.log(`Migrated user: ${user.email} -> ${authUser.user.id}`)
      }
    } catch (error: any) {
      console.error(`Error migrating user ${user.email}:`, error.message)
    }
  }

  return userMap
}

/**
 * Migrate journals dari OJS ke Supabase
 */
async function migrateJournals(
  sourceDb: any,
  supabase: any,
  sourceType: 'mysql' | 'postgres',
  userMap: Map<number, string>
): Promise<Map<number, string>> {
  console.log('Migrating journals...')
  const journalMap = new Map<number, string>()

  let journals: OJSJournal[]
  if (sourceType === 'mysql') {
    const [rows] = await sourceDb.execute(`
      SELECT journal_id, path, primary_locale, enabled
      FROM journals
    `)
    journals = rows as OJSJournal[]
  } else {
    const result = await sourceDb.query(`
      SELECT journal_id, path, primary_locale, enabled
      FROM journals
    `)
    journals = result.rows as OJSJournal[]
  }

  // Create default tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Migrated OJS Tenant',
      slug: 'migrated-ojs',
      description: 'Migrated from OJS',
      is_active: true,
    })
    .select()
    .single()

  if (tenantError) {
    throw new Error(`Failed to create tenant: ${tenantError.message}`)
  }

  for (const journal of journals) {
    try {
      // Get journal settings
      let settings: any = {}
      if (sourceType === 'mysql') {
        const [settingRows] = await sourceDb.execute(`
          SELECT setting_name, setting_value, setting_type
          FROM journal_settings
          WHERE journal_id = ?
        `, [journal.journal_id])
        settings = (settingRows as any[]).reduce((acc: any, row: any) => {
          acc[row.setting_name] = row.setting_value
          return acc
        }, {})
      } else {
        const result = await sourceDb.query(`
          SELECT setting_name, setting_value, setting_type
          FROM journal_settings
          WHERE journal_id = $1
        `, [journal.journal_id])
        settings = result.rows.reduce((acc: any, row: any) => {
          acc[row.setting_name] = row.setting_value
          return acc
        }, {})
      }

      const { data: newJournal, error } = await supabase
        .from('journals')
        .insert({
          tenant_id: tenant.id,
          title: settings.title || `Journal ${journal.journal_id}`,
          description: settings.description || '',
          abbreviation: settings.abbreviation || '',
          issn: settings.issn || '',
          e_issn: settings.e_issn || '',
          publisher: settings.publisher || '',
          language: journal.primary_locale || 'en',
          settings: settings,
          is_active: journal.enabled === 1,
        })
        .select()
        .single()

      if (error) {
        console.error(`Error creating journal ${journal.journal_id}:`, error.message)
        continue
      }

      journalMap.set(journal.journal_id, newJournal.id)
      console.log(`Migrated journal: ${journal.journal_id} -> ${newJournal.id}`)
    } catch (error: any) {
      console.error(`Error migrating journal ${journal.journal_id}:`, error.message)
    }
  }

  return journalMap
}

/**
 * Main migration function
 */
export async function migrateOJS(config: MigrationConfig) {
  console.log('Starting OJS migration...')
  console.log(`Source: ${config.source} | Database: ${config.database}`)

  // Connect to source database
  let sourceDb: any
  if (config.source === 'mysql') {
    sourceDb = await mysql.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
    })
  } else {
    sourceDb = new pg.Client({
      host: config.host,
      port: config.port || 5432,
      user: config.user,
      password: config.password,
      database: config.database,
    })
    await sourceDb.connect()
  }

  // Connect to Supabase
  const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // Step 1: Migrate users
    const userMap = await migrateUsers(sourceDb, supabase, config.source)

    // Step 2: Migrate journals
    const journalMap = await migrateJournals(sourceDb, supabase, config.source, userMap)

    // Step 3: Migrate submissions (simplified - extend as needed)
    console.log('Migration completed!')
    console.log(`Users migrated: ${userMap.size}`)
    console.log(`Journals migrated: ${journalMap.size}`)

    // TODO: Add more migration steps:
    // - Submissions
    // - Reviews
    // - Articles
    // - Issues
    // - Files (with Google Drive mapping)

  } catch (error: any) {
    console.error('Migration error:', error)
    throw error
  } finally {
    if (config.source === 'mysql') {
      await sourceDb.end()
    } else {
      await sourceDb.end()
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const config: Partial<MigrationConfig> = {}

  args.forEach((arg) => {
    const [key, value] = arg.replace('--', '').split('=')
    if (key && value) {
      (config as any)[key] = value
    }
  })

  if (!config.source || !config.host || !config.database) {
    console.error('Usage: npm run migrate -- --source=mysql|postgres --host=... --database=... --user=... --password=... --supabaseUrl=... --supabaseKey=...')
    process.exit(1)
  }

  migrateOJS(config as MigrationConfig)
    .then(() => {
      console.log('Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

