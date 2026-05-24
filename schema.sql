PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND instr(email, '@') > 1),
  password_hash TEXT NOT NULL CHECK (length(password_hash) >= 40),
  role TEXT NOT NULL CHECK (role IN ('tech', 'admin', 'client', 'finance')),
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  force_password_change INTEGER NOT NULL DEFAULT 0 CHECK (force_password_change IN (0, 1)),
  mfa_required INTEGER NOT NULL DEFAULT 0 CHECK (mfa_required IN (0, 1)),
  mfa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (mfa_enabled IN (0, 1)),
  mfa_secret_encrypted TEXT,
  mfa_enabled_at TEXT,
  password_changed_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  owner_company_name TEXT NOT NULL CHECK (length(trim(owner_company_name)) BETWEEN 2 AND 200),
  physical_address TEXT NOT NULL CHECK (length(trim(physical_address)) BETWEEN 5 AND 500),
  site_contact_person TEXT NOT NULL CHECK (length(trim(site_contact_person)) BETWEEN 2 AND 160),
  site_contact_email TEXT CHECK (site_contact_email IS NULL OR instr(site_contact_email, '@') > 1),
  site_contact_phone TEXT,
  billing_emails TEXT NOT NULL CHECK (length(trim(billing_emails)) BETWEEN 3 AND 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS systems (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL CHECK (system_type IN ('Gas Suppression', 'Fire Detection')),
  coverage_area TEXT NOT NULL CHECK (length(trim(coverage_area)) BETWEEN 2 AND 200),
  manufacturer TEXT,
  model_reference TEXT,
  service_interval_months INTEGER NOT NULL DEFAULT 6 CHECK (service_interval_months BETWEEN 1 AND 36),
  last_service_date TEXT,
  last_checked_at TEXT,
  next_due_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  assigned_technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Invoiced')),
  job_type TEXT NOT NULL DEFAULT 'Maintenance',
  site_notes TEXT,
  tech_comments TEXT,
  documentation_path TEXT CHECK (documentation_path IS NULL OR documentation_path LIKE 'jobcards/%'),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS financial_records (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('Quote', 'Invoice', 'Payment')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending Approval', 'Unpaid', 'Settled')),
  distribution_date TEXT NOT NULL,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

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
  linked_job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS client_site_access (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'records' CHECK (access_level IN ('records')),
  granted_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  granted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, site_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IS NULL OR actor_role IN ('tech', 'admin', 'client', 'finance')),
  event_type TEXT NOT NULL CHECK (length(trim(event_type)) BETWEEN 3 AND 80),
  entity_type TEXT NOT NULL CHECK (length(trim(entity_type)) BETWEEN 2 AND 80),
  entity_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
  ip_hash TEXT,
  user_agent TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

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

CREATE TABLE IF NOT EXISTS portal_rate_limits (
  rate_key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (length(token_hash) = 64),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_mfa_required ON users(role, mfa_required, mfa_enabled);
CREATE INDEX IF NOT EXISTS idx_sites_owner_company ON sites(owner_company_name);
CREATE INDEX IF NOT EXISTS idx_systems_site_due ON systems(site_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs(assigned_technician_id, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_system_status ON jobs(system_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_site_status ON financial_records(site_id, payment_status, distribution_date);
CREATE INDEX IF NOT EXISTS idx_financial_job ON financial_records(job_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_site_status ON maintenance_requests(site_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status_priority ON maintenance_requests(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_system ON maintenance_requests(system_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_linked_job ON maintenance_requests(linked_job_id);
CREATE INDEX IF NOT EXISTS idx_client_site_access_site ON client_site_access(site_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created ON audit_events(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_type_created ON audit_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_job_evidence_job ON job_evidence_files(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_evidence_system ON job_evidence_files(system_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_access_actor_created ON document_access_logs(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_access_site_created ON document_access_logs(site_id, created_at);
CREATE INDEX IF NOT EXISTS idx_document_access_path_created ON document_access_logs(storage_path, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_window ON portal_rate_limits(scope, window_start);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens(expires_at, used_at);

CREATE TABLE IF NOT EXISTS revoked_sessions (
  fingerprint TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_sessions_expires ON revoked_sessions (expires_at);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  email TEXT NOT NULL CHECK (instr(email, '@') > 1),
  request_type TEXT NOT NULL CHECK (length(trim(request_type)) BETWEEN 2 AND 120),
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 3000),
  ip_hash TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted ON contact_submissions (submitted_at);

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_sites_updated_at
AFTER UPDATE ON sites
FOR EACH ROW
BEGIN
  UPDATE sites SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

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

CREATE TRIGGER IF NOT EXISTS trg_financial_records_updated_at
AFTER UPDATE ON financial_records
FOR EACH ROW
BEGIN
  UPDATE financial_records SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_maintenance_requests_updated_at
AFTER UPDATE ON maintenance_requests
FOR EACH ROW
BEGIN
  UPDATE maintenance_requests SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
