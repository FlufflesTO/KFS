PRAGMA foreign_keys = OFF;

ALTER TABLE systems ADD COLUMN deleted_at TEXT;

CREATE TABLE IF NOT EXISTS systems_new (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  system_type TEXT NOT NULL CHECK (system_type IN ('Gas Suppression', 'Fire Detection')),
  coverage_area TEXT NOT NULL CHECK (length(trim(coverage_area)) BETWEEN 2 AND 200),
  manufacturer TEXT,
  model_reference TEXT,
  service_interval_months INTEGER NOT NULL DEFAULT 6 CHECK (service_interval_months BETWEEN 1 AND 36),
  last_service_date TEXT,
  last_checked_at TEXT,
  next_due_date TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO systems_new (
  id, site_id, system_type, coverage_area, manufacturer, model_reference,
  service_interval_months, last_service_date, last_checked_at, next_due_date,
  deleted_at, created_at, updated_at
)
SELECT
  id, site_id, system_type, coverage_area, manufacturer, model_reference,
  COALESCE(service_interval_months, 6), last_service_date, last_checked_at, next_due_date,
  deleted_at, created_at, updated_at
FROM systems;

DROP TABLE systems;
ALTER TABLE systems_new RENAME TO systems;

CREATE TABLE IF NOT EXISTS jobs_new (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id),
  assigned_technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Invoiced')),
  job_type TEXT NOT NULL DEFAULT 'Maintenance',
  site_notes TEXT,
  tech_comments TEXT,
  documentation_path TEXT CHECK (documentation_path IS NULL OR documentation_path LIKE 'jobcards/%'),
  completed_at TEXT,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Critical', 'High', 'Normal', 'Low')),
  required_by_date TEXT,
  is_emergency INTEGER NOT NULL DEFAULT 0 CHECK (is_emergency IN (0, 1)),
  estimated_duration_minutes INTEGER,
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO jobs_new (
  id, system_id, assigned_technician_id, scheduled_date, status, job_type,
  site_notes, tech_comments, documentation_path, completed_at, priority,
  required_by_date, is_emergency, estimated_duration_minutes, deleted_at,
  created_at, updated_at
)
SELECT
  id, system_id, assigned_technician_id, scheduled_date, status, job_type,
  site_notes, tech_comments, documentation_path, completed_at, COALESCE(priority, 'Normal'),
  required_by_date, COALESCE(is_emergency, 0), estimated_duration_minutes, deleted_at,
  created_at, updated_at
FROM jobs;

DROP TABLE jobs;
ALTER TABLE jobs_new RENAME TO jobs;

CREATE TABLE IF NOT EXISTS job_visits_new (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visit_date TEXT NOT NULL,
  arrival_time TEXT,
  departure_time TEXT,
  gps_latitude REAL CHECK (gps_latitude IS NULL OR gps_latitude BETWEEN -90 AND 90),
  gps_longitude REAL CHECK (gps_longitude IS NULL OR gps_longitude BETWEEN -180 AND 180),
  customer_name TEXT CHECK (customer_name IS NULL OR length(trim(customer_name)) BETWEEN 2 AND 160),
  customer_title TEXT CHECK (customer_title IS NULL OR length(trim(customer_title)) BETWEEN 2 AND 80),
  notes TEXT CHECK (notes IS NULL OR length(trim(notes)) BETWEEN 5 AND 3000),
  visit_status TEXT NOT NULL DEFAULT 'Arrived' CHECK (visit_status IN ('Travelling', 'Arrived', 'In Progress', 'Completed', 'Unable To Complete', 'Follow-up Required', 'Quote Required')),
  unable_reason TEXT CHECK (unable_reason IS NULL OR unable_reason IN ('No Access', 'Client Unavailable', 'Unsafe To Proceed', 'Parts Required', 'System Isolated', 'Quote Required', 'Return Visit Required', 'Cancelled On Site')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO job_visits_new (
  id, job_id, technician_id, visit_date, arrival_time, departure_time,
  gps_latitude, gps_longitude, customer_name, customer_title, notes,
  visit_status, unable_reason, created_at, updated_at
)
SELECT
  id, job_id, technician_id, visit_date, arrival_time, departure_time,
  gps_latitude, gps_longitude, customer_name, customer_title, notes,
  COALESCE(visit_status, 'Arrived'), unable_reason, created_at, updated_at
FROM job_visits;

DROP TABLE job_visits;
ALTER TABLE job_visits_new RENAME TO job_visits;

CREATE TABLE IF NOT EXISTS defects_new (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id),
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'Major', 'Minor', 'Observation')),
  sans_clause_ref TEXT CHECK (sans_clause_ref IS NULL OR length(trim(sans_clause_ref)) BETWEEN 3 AND 80),
  description TEXT NOT NULL CHECK (length(trim(description)) BETWEEN 5 AND 2000),
  certificate_blocking INTEGER NOT NULL DEFAULT 0 CHECK (certificate_blocking IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  remediation_notes TEXT CHECK (remediation_notes IS NULL OR length(trim(remediation_notes)) BETWEEN 5 AND 3000),
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO defects_new (
  id, system_id, job_id, severity, sans_clause_ref, description,
  certificate_blocking, status, remediation_notes, deleted_at, created_at, updated_at
)
SELECT
  id, system_id, job_id, severity, sans_clause_ref, description,
  certificate_blocking, status, remediation_notes, deleted_at, created_at, updated_at
FROM defects;

DROP TABLE defects;
ALTER TABLE defects_new RENAME TO defects;

CREATE TABLE IF NOT EXISTS certificates_new (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id),
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('Fire Detection', 'Gas Suppression', 'Emergency Lighting', 'Evacuation', 'Combined')),
  issued_date TEXT NOT NULL,
  expiry_date TEXT,
  blocked_by_defect_id TEXT REFERENCES defects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Valid' CHECK (status IN ('Valid', 'Expired', 'Revoked', 'Blocked')),
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO certificates_new (
  id, system_id, job_id, certificate_type, issued_date, expiry_date,
  blocked_by_defect_id, status, deleted_at, created_at, updated_at
)
SELECT
  id, system_id, job_id, certificate_type, issued_date, expiry_date,
  blocked_by_defect_id, status, deleted_at, created_at, updated_at
FROM certificates;

DROP TABLE certificates;
ALTER TABLE certificates_new RENAME TO certificates;

CREATE TABLE IF NOT EXISTS job_evidence_files_new (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  system_id TEXT NOT NULL REFERENCES systems(id),
  uploaded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('Photo')),
  storage_path TEXT NOT NULL UNIQUE CHECK (storage_path LIKE 'job-evidence/%'),
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 1572864),
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO job_evidence_files_new (
  id, job_id, system_id, uploaded_by_user_id, evidence_type,
  storage_path, content_type, file_size_bytes, caption, created_at
)
SELECT
  id, job_id, system_id, uploaded_by_user_id, evidence_type,
  storage_path, content_type, file_size_bytes, caption, created_at
FROM job_evidence_files;

DROP TABLE job_evidence_files;
ALTER TABLE job_evidence_files_new RENAME TO job_evidence_files;

CREATE INDEX IF NOT EXISTS idx_systems_site_due ON systems(site_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs(assigned_technician_id, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_system_status ON jobs(system_id, status);
CREATE INDEX IF NOT EXISTS idx_job_visits_job ON job_visits(job_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_job_visits_tech ON job_visits(technician_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_job_visits_status ON job_visits(visit_status, visit_date);
CREATE INDEX IF NOT EXISTS idx_job_evidence_job ON job_evidence_files(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_evidence_system ON job_evidence_files(system_id, created_at);
CREATE INDEX IF NOT EXISTS idx_defects_system ON defects(system_id, status);
CREATE INDEX IF NOT EXISTS idx_defects_job ON defects(job_id);
CREATE INDEX IF NOT EXISTS idx_defects_blocking ON defects(certificate_blocking, status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity, status);
CREATE INDEX IF NOT EXISTS idx_certificates_system ON certificates(system_id, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_certificates_blocked ON certificates(blocked_by_defect_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry ON certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_systems_deleted_at ON systems(deleted_at);
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_defects_deleted_at ON defects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_certificates_deleted_at ON certificates(deleted_at);

CREATE TRIGGER IF NOT EXISTS trg_systems_updated_at
AFTER UPDATE ON systems
FOR EACH ROW
BEGIN
  UPDATE systems SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_jobs_updated_at
AFTER UPDATE ON jobs
FOR EACH ROW
BEGIN
  UPDATE jobs SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_job_visits_updated_at
AFTER UPDATE ON job_visits
FOR EACH ROW
BEGIN
  UPDATE job_visits SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_defects_updated_at
AFTER UPDATE ON defects
FOR EACH ROW
BEGIN
  UPDATE defects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_certificates_updated_at
AFTER UPDATE ON certificates
FOR EACH ROW
BEGIN
  UPDATE certificates SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

PRAGMA foreign_key_check;
PRAGMA foreign_keys = ON;
