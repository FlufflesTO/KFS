PRAGMA foreign_keys = ON;

ALTER TABLE job_visits
  ADD COLUMN visit_status TEXT NOT NULL DEFAULT 'Arrived'
  CHECK (visit_status IN ('Travelling', 'Arrived', 'In Progress', 'Completed', 'Unable To Complete', 'Follow-up Required', 'Quote Required'));

ALTER TABLE job_visits
  ADD COLUMN unable_reason TEXT
  CHECK (unable_reason IS NULL OR unable_reason IN ('No Access', 'Client Unavailable', 'Unsafe To Proceed', 'Parts Required', 'System Isolated', 'Quote Required', 'Return Visit Required', 'Cancelled On Site'));

CREATE INDEX IF NOT EXISTS idx_job_visits_status ON job_visits(visit_status, visit_date);
