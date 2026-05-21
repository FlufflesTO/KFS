CREATE TABLE IF NOT EXISTS maintenance_requests (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  system_id TEXT REFERENCES systems(id) ON DELETE SET NULL,
  requester_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('Maintenance', 'Fault', 'Compliance Documentation', 'Quote Request', 'Emergency Follow-up')),
  priority TEXT NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'Critical')),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewing', 'Scheduled', 'Closed')),
  subject TEXT NOT NULL CHECK (length(trim(subject)) BETWEEN 3 AND 160),
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 2000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_site_status ON maintenance_requests(site_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status_priority ON maintenance_requests(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_system ON maintenance_requests(system_id);

CREATE TRIGGER IF NOT EXISTS trg_maintenance_requests_updated_at
AFTER UPDATE ON maintenance_requests
FOR EACH ROW
BEGIN
  UPDATE maintenance_requests SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
