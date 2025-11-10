-- OJS Multi-Tenant Database Schema untuk Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANT MANAGEMENT
-- ============================================

-- Table: tenants (organizations/journals)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  domain VARCHAR(255),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Table: user_roles (role definitions)
CREATE TYPE user_role_type AS ENUM ('super_admin', 'editor', 'section_editor', 'reviewer', 'author', 'reader');

-- Table: tenant_users (user-tenant relationship with roles)
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role user_role_type NOT NULL DEFAULT 'reader',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- ============================================
-- JOURNAL MANAGEMENT
-- ============================================

-- Table: journals
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  abbreviation VARCHAR(100),
  issn VARCHAR(20),
  e_issn VARCHAR(20),
  publisher VARCHAR(255),
  language VARCHAR(10) DEFAULT 'id',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: sections (journal sections/categories)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(100),
  description TEXT,
  policy TEXT,
  sequence INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBMISSION WORKFLOW
-- ============================================

-- Table: submissions
CREATE TYPE submission_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'review_completed',
  'revision_requested',
  'accepted',
  'declined',
  'published',
  'archived'
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  submitter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  abstract TEXT,
  keywords TEXT[],
  language VARCHAR(10) DEFAULT 'id',
  status submission_status DEFAULT 'draft',
  submission_date TIMESTAMP WITH TIME ZONE,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  current_round INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: submission_authors (many-to-many relationship)
CREATE TABLE submission_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  affiliation TEXT,
  country VARCHAR(100),
  bio TEXT,
  is_primary BOOLEAN DEFAULT false,
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: submission_files
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'manuscript', 'supplementary', 'figure', etc.
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PEER REVIEW SYSTEM
-- ============================================

-- Table: review_assignments
CREATE TYPE review_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');
CREATE TYPE review_recommendation AS ENUM ('accept', 'minor_revision', 'major_revision', 'reject', 'resubmit');

CREATE TABLE review_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round INTEGER DEFAULT 1,
  status review_status DEFAULT 'pending',
  recommendation review_recommendation,
  review_due_date TIMESTAMP WITH TIME ZONE,
  review_completed_date TIMESTAMP WITH TIME ZONE,
  review_form_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: review_files (files shared with reviewers)
CREATE TABLE review_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_assignment_id UUID NOT NULL REFERENCES review_assignments(id) ON DELETE CASCADE,
  submission_file_id UUID NOT NULL REFERENCES submission_files(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EDITORIAL DECISIONS
-- ============================================

-- Table: editorial_decisions
CREATE TYPE decision_type AS ENUM ('accept', 'decline', 'revision', 'resubmit');

CREATE TABLE editorial_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_type decision_type NOT NULL,
  round INTEGER DEFAULT 1,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PUBLISHING SYSTEM
-- ============================================

-- Table: articles (published articles)
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  abstract TEXT,
  keywords TEXT[],
  doi VARCHAR(255),
  volume INTEGER,
  issue INTEGER,
  year INTEGER,
  pages VARCHAR(50),
  published_date TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  citation_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: article_authors (published article authors)
CREATE TABLE article_authors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  affiliation TEXT,
  country VARCHAR(100),
  sequence INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: article_files (published article files)
CREATE TABLE article_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_journals_tenant_id ON journals(tenant_id);
CREATE INDEX idx_sections_journal_id ON sections(journal_id);
CREATE INDEX idx_submissions_journal_id ON submissions(journal_id);
CREATE INDEX idx_submissions_submitter_id ON submissions(submitter_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submission_authors_submission_id ON submission_authors(submission_id);
CREATE INDEX idx_review_assignments_submission_id ON review_assignments(submission_id);
CREATE INDEX idx_review_assignments_reviewer_id ON review_assignments(reviewer_id);
CREATE INDEX idx_articles_journal_id ON articles(journal_id);
CREATE INDEX idx_articles_published_date ON articles(published_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorial_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_files ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
-- Users can read their own tenant data
CREATE POLICY "Users can view their tenant data" ON tenant_users
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view journals in their tenant
CREATE POLICY "Users can view journals in their tenant" ON journals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = journals.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Authors can view their own submissions
CREATE POLICY "Authors can view their submissions" ON submissions
  FOR SELECT USING (submitter_id = auth.uid());

-- Editors can view all submissions in their journal
CREATE POLICY "Editors can view submissions in their journal" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      JOIN journals ON journals.tenant_id = tenant_users.tenant_id
      WHERE journals.id = submissions.journal_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('editor', 'section_editor', 'super_admin')
    )
  );

-- Reviewers can view assigned reviews
CREATE POLICY "Reviewers can view assigned reviews" ON review_assignments
  FOR SELECT USING (reviewer_id = auth.uid());

-- Published articles are viewable by all authenticated users
CREATE POLICY "Published articles are viewable" ON articles
  FOR SELECT USING (published_date IS NOT NULL);

