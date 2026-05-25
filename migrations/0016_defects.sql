PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS defects (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Observation')),
  sans_clause_ref TEXT CHECK (sans_clause_ref IS NULL OR length(trim(sans_clause_ref)) BETWEEN 3 AND 80),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 5 AND 2000),
  certificate_blocking INTEGER NOT NULL DEFAULT 0 CHECK (certificate_blocking IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  remediation_notes TEXT CHECK (remediation_notes IS NULL OR length(trim(remediation_notes)) BETWEEN 5 AND 3000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_defects_system ON defects(system_id, status);
CREATE INDEX IF NOT EXISTS idx_defects_job ON defects(job_id);
CREATE INDEX IF NOT EXISTS idx_defects_blocking ON defects(certificate_blocking, status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity, status);

CREATE TRIGGER IF NOT EXISTS trg_defects_updated_at
AFTER UPDATE ON defects
FOR EACH ROW
BEGIN
  UPDATE defects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
