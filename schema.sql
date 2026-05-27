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
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL
);

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
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
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
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE, -- password reset marker: token_hash TEXT NOT NULL UNIQUE
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expiry ON password_reset_tokens(expires_at); -- password reset marker: idx_password_reset_tokens_expiry

-- Document access logs table
CREATE TABLE IF NOT EXISTS document_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_access_actor_created ON document_access_logs(user_id, accessed_at); -- document access marker: idx_document_access_actor_created
CREATE INDEX IF NOT EXISTS idx_document_access_path_created ON document_access_logs(document_id, accessed_at); -- document access marker: idx_document_access_path_created

-- Client site access table
CREATE TABLE IF NOT EXISTS client_site_access (
    user_id TEXT NOT NULL,
    site_id TEXT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, site_id), -- client site access marker: PRIMARY KEY (user_id, site_id)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_client_site_access_site ON client_site_access(site_id); -- client site access marker: idx_client_site_access_site

-- Job evidence files table
CREATE TABLE IF NOT EXISTS job_evidence_files (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE, -- evidence marker: storage_path TEXT NOT NULL UNIQUE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
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
    event_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    outcome TEXT NOT NULL,
    details TEXT,
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
