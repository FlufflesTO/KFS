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
  sage_quote_number TEXT,
  sage_invoice_number TEXT,
  sage_customer_code TEXT,
  sage_amount_ex_vat REAL,
  sage_vat_amount REAL,
  sage_payment_reference TEXT,
  finance_task_status TEXT CHECK (finance_task_status IN (
    'Invoice Required', 'Quote Required', 'Sage Reference Missing',
    'Awaiting Payment', 'Complete'
  )),
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
CREATE INDEX IF NOT EXISTS idx_finance_task_status ON financial_records(finance_task_status);
CREATE INDEX IF NOT EXISTS idx_finance_sage_invoice ON financial_records(sage_invoice_number);
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

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL CHECK (length(trim(company_name)) BETWEEN 2 AND 200),
  contact_person TEXT CHECK (contact_person IS NULL OR length(trim(contact_person)) BETWEEN 2 AND 160),
  contact_email TEXT CHECK (contact_email IS NULL OR instr(contact_email, '@') > 1),
  contact_phone TEXT,
  billing_address TEXT CHECK (billing_address IS NULL OR length(trim(billing_address)) BETWEEN 5 AND 500),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS job_visits (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visit_date TEXT NOT NULL,
  arrival_time TEXT,
  departure_time TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  customer_name TEXT CHECK (customer_name IS NULL OR length(trim(customer_name)) BETWEEN 2 AND 160),
  customer_title TEXT CHECK (customer_title IS NULL OR length(trim(customer_title)) BETWEEN 2 AND 80),
  notes TEXT CHECK (notes IS NULL OR length(trim(notes)) BETWEEN 5 AND 3000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

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

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(contact_email);
CREATE INDEX IF NOT EXISTS idx_job_visits_job ON job_visits(job_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_job_visits_tech ON job_visits(technician_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_defects_system ON defects(system_id, status);
CREATE INDEX IF NOT EXISTS idx_defects_job ON defects(job_id);
CREATE INDEX IF NOT EXISTS idx_defects_blocking ON defects(certificate_blocking, status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity, status);
CREATE INDEX IF NOT EXISTS idx_certificates_system ON certificates(system_id, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_certificates_blocked ON certificates(blocked_by_defect_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry ON certificates(expiry_date);

CREATE TRIGGER IF NOT EXISTS trg_clients_updated_at
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
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
