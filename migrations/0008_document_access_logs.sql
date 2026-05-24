CREATE TABLE IF NOT EXISTS document_access_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IS NULL OR actor_role IN ('tech', 'admin', 'client', 'finance')),
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL CHECK (storage_path LIKE 'jobcards/%' OR storage_path LIKE 'job-evidence/%'),
  document_type TEXT NOT NULL CHECK (document_type IN ('Jobcard PDF', 'Evidence Photo')),
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
  ip_hash TEXT,
  user_agent TEXT,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_document_access_actor_created ON document_access_logs(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_access_site_created ON document_access_logs(site_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_access_path_created ON document_access_logs(storage_path, created_at);
