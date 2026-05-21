ALTER TABLE maintenance_requests ADD COLUMN linked_job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_linked_job ON maintenance_requests(linked_job_id);
