-- Phase 23: Admin Dispatch Board Enhancements
-- Add unassigned jobs queue, technician workload tracking, and SLA monitoring

ALTER TABLE jobs 
ADD COLUMN sla_due_date TEXT;

ALTER TABLE jobs 
ADD COLUMN sla_priority TEXT DEFAULT 'Normal' CHECK (sla_priority IN ('Critical', 'High', 'Normal', 'Low'));

ALTER TABLE jobs 
ADD COLUMN dispatch_board_order INTEGER DEFAULT 0;

-- Create table for technician workload tracking
CREATE TABLE IF NOT EXISTS technician_workload (
  id TEXT PRIMARY KEY,
  technician_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  scheduled_jobs_count INTEGER NOT NULL DEFAULT 0 CHECK (scheduled_jobs_count >= 0),
  completed_jobs_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_jobs_count >= 0),
  total_hours_estimated REAL DEFAULT 0,
  capacity_status TEXT DEFAULT 'Available' CHECK (capacity_status IN ('Available', 'At Capacity', 'Overloaded')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Unique constraint to prevent duplicate workload entries per technician per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_technician_workload_unique ON technician_workload(technician_user_id, work_date);

-- Index for workload queries
CREATE INDEX IF NOT EXISTS idx_technician_workload_date ON technician_workload(work_date, capacity_status);

-- Update existing jobs with SLA due dates based on priority and scheduled date
UPDATE jobs 
SET sla_due_date = scheduled_date,
    sla_priority = CASE 
      WHEN job_type LIKE '%Emergency%' THEN 'Critical'
      WHEN job_type LIKE '%Fault%' THEN 'High'
      ELSE 'Normal'
    END
WHERE sla_due_date IS NULL;

-- Index for SLA monitoring
CREATE INDEX IF NOT EXISTS idx_jobs_sla_tracking ON jobs(sla_priority, sla_due_date, status) WHERE status IN ('Scheduled', 'In Progress');

-- Index for unassigned jobs queue
CREATE INDEX IF NOT EXISTS idx_jobs_unassigned ON jobs(assigned_technician_id, scheduled_date, sla_priority) WHERE assigned_technician_id IS NULL AND status IN ('Scheduled', 'In Progress');

-- Trigger to maintain technician_workload updated_at
CREATE TRIGGER IF NOT EXISTS trg_technician_workload_updated_at
AFTER UPDATE ON technician_workload
FOR EACH ROW
BEGIN
  UPDATE technician_workload SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

COMMENT: This migration adds admin dispatch board enhancements.
- sla_due_date: Service level agreement due date for the job
- sla_priority: Priority level for SLA tracking (Critical/High/Normal/Low)
- dispatch_board_order: Custom ordering for dispatch board display
- technician_workload: Table for tracking technician capacity and workload
- Indexes support unassigned jobs queue and SLA monitoring queries
