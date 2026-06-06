-- Project Sentinel - Add completed_at to finance_tasks
-- Purpose: Track when a finance task is marked Completed or Cancelled
-- Dependencies: migrations
-- Structural Role: Schema migration

ALTER TABLE finance_tasks ADD COLUMN completed_at TEXT;
