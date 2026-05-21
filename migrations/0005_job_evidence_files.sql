CREATE TABLE IF NOT EXISTS job_evidence_files (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('Photo')),
  storage_path TEXT NOT NULL UNIQUE CHECK (storage_path LIKE 'job-evidence/%'),
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 1572864),
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_job_evidence_job ON job_evidence_files(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_evidence_system ON job_evidence_files(system_id, created_at);
