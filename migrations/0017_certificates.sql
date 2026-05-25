PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('Fire Detection', 'Gas Suppression', 'Emergency Lighting', 'Evacuation', 'Combined')),
  issued_date TEXT NOT NULL,
  expiry_date TEXT,
  blocked_by_defect_id TEXT REFERENCES defects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Valid' CHECK (status IN ('Valid', 'Expired', 'Revoked', 'Blocked')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_certificates_system ON certificates(system_id, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_certificates_blocked ON certificates(blocked_by_defect_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry ON certificates(expiry_date);

CREATE TRIGGER IF NOT EXISTS trg_certificates_updated_at
AFTER UPDATE ON certificates
FOR EACH ROW
BEGIN
  UPDATE certificates SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
