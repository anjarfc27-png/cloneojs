-- Migration: Add workflow fields for editorial workflow
-- Date: 2025-11-10
-- Description: Add fields for complete editorial workflow

-- Add workflow fields to submissions table
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS workflow_stage VARCHAR(50) DEFAULT 'submission',
  ADD COLUMN IF NOT EXISTS production_ready BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS workflow_notes TEXT,
  ADD COLUMN IF NOT EXISTS workflow_history JSONB DEFAULT '[]';

-- Create workflow_history table for detailed workflow tracking
CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  from_status submission_status,
  to_status submission_status,
  action VARCHAR(100) NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for workflow_history
CREATE INDEX IF NOT EXISTS idx_workflow_history_submission_id 
  ON workflow_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_created_at 
  ON workflow_history(created_at DESC);

-- Add copyediting fields to submissions
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS copyeditor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS copyedit_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS copyedit_completed_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS layout_editor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS layout_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS layout_completed_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS proofreader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proofread_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS proofread_completed_date TIMESTAMP WITH TIME ZONE;

-- Create editorial_assignments table for tracking editor assignments
CREATE TABLE IF NOT EXISTS editorial_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  editor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_type VARCHAR(50) NOT NULL, -- 'editor', 'section_editor', 'copyeditor', 'layout_editor', 'proofreader'
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(submission_id, editor_id, assignment_type)
);

-- Create index for editorial_assignments
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_submission_id 
  ON editorial_assignments(submission_id);
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_editor_id 
  ON editorial_assignments(editor_id);
CREATE INDEX IF NOT EXISTS idx_editorial_assignments_assignment_type 
  ON editorial_assignments(assignment_type);

-- Add workflow stage enum (if not exists as type)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_stage_type') THEN
    CREATE TYPE workflow_stage_type AS ENUM (
      'submission',
      'review',
      'revision',
      'copyediting',
      'production',
      'scheduled',
      'published'
    );
  END IF;
END $$;

-- Update workflow_stage column to use enum
-- Note: This requires dropping and recreating the column if it already exists
-- For safety, we'll keep it as VARCHAR for now

-- Add comments
COMMENT ON COLUMN submissions.workflow_stage IS 'Current stage in editorial workflow';
COMMENT ON COLUMN submissions.production_ready IS 'Whether submission is ready for production';
COMMENT ON COLUMN submissions.scheduled_date IS 'Scheduled publication date';
COMMENT ON COLUMN submissions.workflow_notes IS 'Notes about workflow progress';
COMMENT ON COLUMN submissions.workflow_history IS 'JSON array of workflow history entries';



