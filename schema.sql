-- Main schema for Kharon Fire and Security Solutions
-- Designed for SQLite compatibility (D1)

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('tech', 'admin', 'client', 'finance')),
    is_active INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMP,
    mfa_required INTEGER NOT NULL DEFAULT 0, -- MFA marker: mfa_required INTEGER NOT NULL DEFAULT 0
    mfa_secret TEXT,
    mfa_secret_encrypted TEXT, -- schema.sql missing MFA marker: mfa_secret_encrypted TEXT
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_mfa_required ON users(mfa_required); -- schema.sql missing MFA marker: idx_users_mfa_required
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    billing_address TEXT,
    sage_contact_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    owner_company_name TEXT NOT NULL,
    physical_address TEXT NOT NULL,
    postal_address TEXT,
    site_contact_person TEXT NOT NULL,
    site_contact_email TEXT NOT NULL,
    site_contact_phone TEXT NOT NULL,
    gps_coordinates TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Systems table
CREATE TABLE IF NOT EXISTS systems (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    system_type TEXT NOT NULL,
    system_subtype TEXT,
    serial_number TEXT,
    installation_date DATE,
    last_service_date DATE,
    next_due_date DATE NOT NULL,
    service_interval_months INTEGER NOT NULL DEFAULT 6,
    coverage_area TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    system_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    priority TEXT NOT NULL DEFAULT 'Normal',
    assigned_technician_id TEXT,
    completed_date DATE,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_version ON jobs(version);

-- Job cards table
CREATE TABLE IF NOT EXISTS job_cards (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    technician_notes TEXT,
    completion_checklist TEXT,
    evidence_photos TEXT,
    customer_signature TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

-- Financial records table
CREATE TABLE IF NOT EXISTS financial_records (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    job_id TEXT,
    item_type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    vat_amount INTEGER NOT NULL DEFAULT 0,
    distribution_date DATE NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'Unpaid', -- financial_records marker: payment_status
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- password reset marker: token_hash TEXT NOT NULL UNIQUE
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens(expires_at); -- password reset marker: idx_password_reset_tokens_expiry

-- Document access logs table
CREATE TABLE IF NOT EXISTS document_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_document_access_actor_created ON document_access_logs(user_id, accessed_at); -- document access marker: idx_document_access_actor_created
CREATE INDEX IF NOT EXISTS idx_document_access_path_created ON document_access_logs(document_id, accessed_at); -- document access marker: idx_document_access_path_created

-- Client site access table
CREATE TABLE IF NOT EXISTS client_site_access (
    user_id TEXT NOT NULL,
    site_id TEXT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, site_id), -- client site access marker: PRIMARY KEY (user_id, site_id)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_client_site_access_site ON client_site_access(site_id); -- client site access marker: idx_client_site_access_site

-- Job evidence files table
CREATE TABLE IF NOT EXISTS job_evidence_files (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE, -- evidence marker: storage_path TEXT NOT NULL UNIQUE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_evidence_job ON job_evidence_files(job_id); -- evidence marker: idx_job_evidence_job

-- User feedback table (Phase 11)
CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    variant TEXT,
    page_path TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_submitted ON user_feedback(submitted_at);

-- Audit events table (Phase 11)
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    actor_user_id TEXT,
    actor_role TEXT CHECK (actor_role IS NULL OR actor_role IN ('tech', 'admin', 'client', 'finance')),
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
    ip_hash TEXT,
    user_agent TEXT,
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for audit events table
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created ON audit_events(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_type_created ON audit_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_outcome_created ON audit_events(outcome, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);

-- Portal rate limits table (Phase 11)
CREATE TABLE IF NOT EXISTS portal_rate_limits (
    id TEXT PRIMARY KEY,
    scope TEXT NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    limit_count INTEGER NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for portal rate limits table
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_window ON portal_rate_limits(scope, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON portal_rate_limits(updated_at);

-- ============================================================================
-- MISSING TABLES FROM MIGRATIONS
-- ============================================================================

-- Revoked sessions table (from 0009_revoked_sessions.sql)
CREATE TABLE IF NOT EXISTS revoked_sessions (
    fingerprint TEXT PRIMARY KEY NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_sessions_expires ON revoked_sessions(expires_at);

-- Contact submissions table (from 0011_contact_submissions.sql)
CREATE TABLE IF NOT EXISTS contact_submissions (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
    email TEXT NOT NULL CHECK (instr(email, '@') > 1),
    request_type TEXT NOT NULL CHECK (length(trim(request_type)) BETWEEN 2 AND 120),
    message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 3000),
    ip_hash TEXT NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted ON contact_submissions(submitted_at);

-- Job visits table (from 0015_job_visits.sql)
CREATE TABLE IF NOT EXISTS job_visits (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
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

CREATE INDEX IF NOT EXISTS idx_job_visits_job ON job_visits(job_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_job_visits_tech ON job_visits(technician_id, visit_date);

CREATE TRIGGER IF NOT EXISTS trg_job_visits_updated_at
AFTER UPDATE ON job_visits
FOR EACH ROW
BEGIN
    UPDATE job_visits SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

-- Defects table (from 0016_defects.sql)
CREATE TABLE IF NOT EXISTS defects (
    id TEXT PRIMARY KEY,
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE RESTRICT,
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

-- Certificates table (from 0017_certificates.sql)
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE RESTRICT,
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

-- Sage configuration table (from 0024_sage_oauth_tokens.sql)
CREATE TABLE IF NOT EXISTS sage_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS trg_sage_config_updated_at
AFTER UPDATE ON sage_config
FOR EACH ROW
BEGIN
    UPDATE sage_config SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

-- Finance tasks table (from 0025_finance_tasks.sql)
CREATE TABLE IF NOT EXISTS finance_tasks (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('Quote Required', 'Quote Issued in Sage', 'Quote Approved', 'Invoice Required', 'Invoice Issued in Sage', 'Payment Recorded in Sage', 'Finance Follow-up')),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    vat_amount NUMERIC CHECK (vat_amount >= 0),
    reference TEXT,
    sage_document_ref TEXT,
    sage_document_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_finance_tasks_site ON finance_tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_finance_tasks_job ON finance_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_finance_tasks_status ON finance_tasks(status);

CREATE TRIGGER IF NOT EXISTS trg_finance_tasks_updated_at
AFTER UPDATE ON finance_tasks
FOR EACH ROW
BEGIN
    UPDATE finance_tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

-- Rate limits table (from 0029_rate_limits_table.sql)
CREATE TABLE IF NOT EXISTS rate_limits (
    identifier TEXT NOT NULL,
    accessed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_accessed ON rate_limits(identifier, accessed_at);

-- Data retention policies table (from 0031_data_retention_policies.sql)
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    legal_basis TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_data_retention_policies_entity_type ON data_retention_policies(entity_type);
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_active ON data_retention_policies(is_active);

-- Data retention logs table (from 0031_data_retention_policies.sql)
CREATE TABLE IF NOT EXISTS data_retention_logs (
    id TEXT PRIMARY KEY,
    policy_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    records_affected INTEGER NOT NULL DEFAULT 0,
    operation_type TEXT NOT NULL DEFAULT 'delete',
    operation_status TEXT NOT NULL DEFAULT 'completed',
    error_message TEXT,
    executed_by TEXT,
    executed_at TEXT NOT NULL DEFAULT (datetime('now')),
    execution_duration_ms INTEGER,
    FOREIGN KEY (policy_id) REFERENCES data_retention_policies(id)
);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_policy_id ON data_retention_logs(policy_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_entity_type ON data_retention_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_executed_at ON data_retention_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_status ON data_retention_logs(operation_status);

-- Retention policy summary view (from 0031_data_retention_policies.sql)
CREATE VIEW IF NOT EXISTS v_retention_policy_summary AS
SELECT
    entity_type,
    retention_days,
    CASE
        WHEN retention_days < 7 THEN retention_days || ' days'
        WHEN retention_days < 30 THEN (retention_days / 7) || ' weeks'
        WHEN retention_days < 365 THEN (retention_days / 30) || ' months'
        ELSE (retention_days / 365) || ' years'
    END as retention_period_human,
    legal_basis,
    is_active
FROM data_retention_policies
WHERE is_active = 1
ORDER BY retention_days DESC;
