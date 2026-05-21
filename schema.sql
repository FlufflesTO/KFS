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

CREATE TABLE IF NOT EXISTS portal_rate_limits (
  rate_key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_owner_company ON sites(owner_company_name);
CREATE INDEX IF NOT EXISTS idx_systems_site_due ON systems(site_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs(assigned_technician_id, status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_system_status ON jobs(system_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_site_status ON financial_records(site_id, payment_status, distribution_date);
CREATE INDEX IF NOT EXISTS idx_financial_job ON financial_records(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created ON audit_events(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_type_created ON audit_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_window ON portal_rate_limits(scope, window_start);

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
