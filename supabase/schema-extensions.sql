-- ============================================
-- EXTENSIONS FOR OJS PKP COMPATIBILITY
-- ============================================

-- Table: issues (journal issues)saya 
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  volume INTEGER,
  number VARCHAR(50),
  year INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  is_published BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  cover_image_alt_text TEXT,
  access_status VARCHAR(50) DEFAULT 'open', -- 'open', 'subscription', 'restricted'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(journal_id, volume, number, year)
);

-- Table: volumes (journal volumes - optional grouping)
CREATE TABLE IF NOT EXISTS volumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  volume_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  title VARCHAR(255),
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(journal_id, volume_number, year)
);

-- Update articles table to reference issues
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS volume_id UUID REFERENCES volumes(id) ON DELETE SET NULL;

-- Table: user_profiles (extended user metadata)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  orcid_id VARCHAR(19), -- ORCID format: 0000-0000-0000-0000
  orcid_access_token TEXT, -- Encrypted ORCID access token
  researcher_id VARCHAR(255), -- ResearcherID
  scopus_author_id VARCHAR(255), -- Scopus Author ID
  google_scholar_id VARCHAR(255), -- Google Scholar ID
  bio TEXT,
  affiliation TEXT,
  country VARCHAR(100),
  url TEXT,
  phone VARCHAR(50),
  mailing_address TEXT,
  billing_address TEXT,
  locale VARCHAR(10) DEFAULT 'id',
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  signature TEXT, -- Digital signature for reviews
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: submission_authors - add ORCID
ALTER TABLE submission_authors 
  ADD COLUMN IF NOT EXISTS orcid_id VARCHAR(19),
  ADD COLUMN IF NOT EXISTS researcher_id VARCHAR(255);

-- Table: article_authors - add ORCID
ALTER TABLE article_authors 
  ADD COLUMN IF NOT EXISTS orcid_id VARCHAR(19),
  ADD COLUMN IF NOT EXISTS researcher_id VARCHAR(255);

-- Table: google_drive_files (mapping files to Google Drive)
CREATE TABLE IF NOT EXISTS google_drive_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id VARCHAR(255) NOT NULL UNIQUE, -- Google Drive file ID
  file_name VARCHAR(255) NOT NULL,
  web_view_link TEXT NOT NULL, -- Google Drive webViewLink
  web_content_link TEXT, -- Direct download link
  mime_type VARCHAR(100),
  file_size BIGINT,
  thumbnail_link TEXT,
  parent_folder_id VARCHAR(255), -- Google Drive folder ID
  submission_file_id UUID REFERENCES submission_files(id) ON DELETE CASCADE,
  article_file_id UUID REFERENCES article_files(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: doi_registrations (DOI management)
CREATE TABLE IF NOT EXISTS doi_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  doi VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'registered', 'failed'
  registration_date TIMESTAMP WITH TIME ZONE,
  registration_agency VARCHAR(100), -- 'crossref', 'datacite', etc.
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: publication_history (tracking publication changes)
CREATE TABLE IF NOT EXISTS publication_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'published', 'unpublished', 'updated', 'retracted'
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  previous_data JSONB, -- Snapshot of previous state
  new_data JSONB, -- New state
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: plugin_settings (for OJS plugin compatibility)
CREATE TABLE IF NOT EXISTS plugin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
  plugin_name VARCHAR(255) NOT NULL,
  setting_name VARCHAR(255) NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'object'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(journal_id, plugin_name, setting_name)
);

-- Table: citation_metadata (for citation tracking)
CREATE TABLE IF NOT EXISTS citation_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  citation_count INTEGER DEFAULT 0,
  citation_data JSONB DEFAULT '{}', -- Structured citation data
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issues_journal_id ON issues(journal_id);
CREATE INDEX IF NOT EXISTS idx_issues_published_date ON issues(published_date);
CREATE INDEX IF NOT EXISTS idx_volumes_journal_id ON volumes(journal_id);
CREATE INDEX IF NOT EXISTS idx_articles_issue_id ON articles(issue_id);
CREATE INDEX IF NOT EXISTS idx_articles_volume_id ON articles(volume_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_orcid ON user_profiles(orcid_id);
CREATE INDEX IF NOT EXISTS idx_google_drive_files_file_id ON google_drive_files(file_id);
CREATE INDEX IF NOT EXISTS idx_doi_registrations_doi ON doi_registrations(doi);
CREATE INDEX IF NOT EXISTS idx_doi_registrations_article_id ON doi_registrations(article_id);
CREATE INDEX IF NOT EXISTS idx_publication_history_article_id ON publication_history(article_id);
CREATE INDEX IF NOT EXISTS idx_plugin_settings_journal_id ON plugin_settings(journal_id);

-- RLS Policies
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE doi_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE publication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_metadata ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Published issues are viewable by all
CREATE POLICY "Published issues are viewable" ON issues
  FOR SELECT USING (is_published = true OR EXISTS (
    SELECT 1 FROM tenant_users
    JOIN journals ON journals.tenant_id = tenant_users.tenant_id
    WHERE journals.id = issues.journal_id
    AND tenant_users.user_id = auth.uid()
  ));

-- Google Drive files - users can view files they uploaded or have access to
CREATE POLICY "Users can view their uploaded files" ON google_drive_files
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM submission_files sf
      JOIN submissions s ON s.id = sf.submission_id
      WHERE sf.id = google_drive_files.submission_file_id
      AND (s.submitter_id = auth.uid() OR EXISTS (
        SELECT 1 FROM tenant_users tu
        JOIN journals j ON j.tenant_id = tu.tenant_id
        WHERE j.id = s.journal_id
        AND tu.user_id = auth.uid()
        AND tu.role IN ('editor', 'section_editor', 'super_admin', 'reviewer')
      ))
    )
  );

-- DOI registrations - viewable by journal editors
CREATE POLICY "Editors can view DOI registrations" ON doi_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM articles a
      JOIN journals j ON j.id = a.journal_id
      JOIN tenant_users tu ON tu.tenant_id = j.tenant_id
      WHERE a.id = doi_registrations.article_id
      AND tu.user_id = auth.uid()
      AND tu.role IN ('editor', 'section_editor', 'super_admin')
    )
  );

