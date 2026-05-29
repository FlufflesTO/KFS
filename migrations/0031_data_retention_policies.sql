-- Migration 0031: Data Retention Policies (POPIA Section 14 Compliance)
-- Purpose: Implement data retention policies for POPIA Section 14 data minimization compliance.
--          Automatically delete personal data after legally-defined retention periods.
-- 
-- POPIA Section 14 requires that personal information must not be retained longer than
-- necessary for the purpose for which it was collected. This migration establishes:
-- - Policy definitions for each data type
-- - Audit trail for all deletion operations
-- - Legal basis documentation for each retention period
--
-- Dependencies: 0029_rate_limits_table.sql
-- Author: Core-Back (Phase 2: POPIA Compliance)
-- Date: 2026-05-29

-- ============================================================================
-- Data Retention Policies Table
-- ============================================================================

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

-- Create index for efficient policy lookups
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_entity_type 
ON data_retention_policies(entity_type);

CREATE INDEX IF NOT EXISTS idx_data_retention_policies_active 
ON data_retention_policies(is_active);

-- ============================================================================
-- Data Retention Logs Table (Audit Trail)
-- ============================================================================

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

-- Create indexes for efficient audit queries
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_policy_id 
ON data_retention_logs(policy_id);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_entity_type 
ON data_retention_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_executed_at 
ON data_retention_logs(executed_at);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_status 
ON data_retention_logs(operation_status);

-- ============================================================================
-- Initial Retention Policies
-- ============================================================================

-- Audit Events: 2 years (730 days)
-- Legal Basis: Operational requirement for security monitoring, incident investigation,
--              and compliance auditing. Retained for sufficient period to detect
--              patterns and support forensic analysis.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_audit_events',
    'audit_events',
    730,
    'Operational requirement for security monitoring and compliance auditing. Retained for 2 years to support incident investigation and forensic analysis.',
    'Security audit events including authentication, authorization, and administrative actions',
    1
);

-- User Feedback: 1 year (365 days)
-- Legal Basis: Product improvement and quality assurance. Retained for 1 year to
--              analyze trends and improve service delivery.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_user_feedback',
    'user_feedback',
    365,
    'Product improvement and quality assurance. Retained for 1 year to analyze feedback trends and improve service delivery.',
    'User-submitted feedback, bug reports, and feature requests',
    1
);

-- Rate Limits: 1 day (24 hours)
-- Legal Basis: Security requirement for abuse prevention. Short retention period
--              sufficient for rate limiting functionality while minimizing data storage.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_rate_limits',
    'rate_limits',
    1,
    'Security requirement for abuse prevention. Minimal retention period sufficient for rate limiting functionality.',
    'Rate limiting records for API abuse prevention',
    1
);

-- Document Access Logs: 1 year (365 days)
-- Legal Basis: Compliance auditing and access monitoring. Retained for 1 year to
--              track document access patterns and support access audits.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_document_access_logs',
    'document_access_logs',
    365,
    'Compliance auditing and access monitoring. Retained for 1 year to track document access patterns and support access audits.',
    'Logs of document access events for compliance and security monitoring',
    1
);

-- Session Revocations: 90 days
-- Legal Basis: Security requirement for session management. Retained for 90 days
--              to prevent session replay attacks while minimizing stored data.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_session_revocations',
    'session_revocations',
    90,
    'Security requirement for session management. Retained for 90 days to prevent session replay attacks.',
    'Revoked session tokens to prevent reuse',
    1
);

-- Contact Enquiries: 2 years (730 days)
-- Legal Basis: Business communication and customer service. Retained for 2 years
--              to maintain communication history and support customer service.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_contact_enquiries',
    'contact_submissions',
    730,
    'Business communication and customer service. Retained for 2 years to maintain communication history.',
    'Contact form submissions and enquiry records',
    1
);

-- Password Reset Tokens: 1 day (1 day)
-- Legal Basis: Security requirement for authentication. Tokens expire quickly
--              to prevent unauthorized access.
INSERT INTO data_retention_policies (id, entity_type, retention_days, legal_basis, description, is_active)
VALUES (
    'policy_password_reset_tokens',
    'password_reset_tokens',
    1,
    'Security requirement for authentication. Tokens expire within 1 day to prevent unauthorized access.',
    'Password reset tokens for account recovery',
    1
);

-- ============================================================================
-- Helper View: Retention Policy Summary
-- ============================================================================

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

-- ============================================================================
-- Cleanup Note
-- ============================================================================

-- Note: Actual data deletion is performed by the data retention cron endpoint:
-- POST /portal/api/admin/data-retention-cron
--
-- The endpoint will:
-- 1. Query this table for active policies
-- 2. Calculate cutoff dates based on retention_days
-- 3. Delete expired records from each entity table
-- 4. Log each deletion operation in data_retention_logs
--
-- This migration only creates the policy framework. Execution is manual/scheduled.
