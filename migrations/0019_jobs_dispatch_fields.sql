-- Phase 23: Add dispatch planning fields to jobs table
ALTER TABLE jobs ADD COLUMN priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Critical', 'High', 'Normal', 'Low'));
ALTER TABLE jobs ADD COLUMN required_by_date TEXT;
ALTER TABLE jobs ADD COLUMN is_emergency INTEGER NOT NULL DEFAULT 0 CHECK (is_emergency IN (0, 1));
ALTER TABLE jobs ADD COLUMN estimated_duration_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_jobs_priority_status ON jobs(priority, status);
CREATE INDEX IF NOT EXISTS idx_jobs_emergency_status ON jobs(is_emergency, status);
CREATE INDEX IF NOT EXISTS idx_jobs_required_by ON jobs(required_by_date, status);
