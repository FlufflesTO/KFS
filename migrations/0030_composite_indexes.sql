-- Project Sentinel - Migration 0030: Composite Indexes for Backend Optimization
-- Purpose: Add composite indexes for improved query performance on high-traffic tables
-- Dependencies: 0029_rate_limits_table.sql
-- Structural Role: Performance optimization - Phase 1 Backend Optimization Roadmap
--
-- This migration adds composite indexes to support:
-- - Repository layer queries with soft-delete filtering
-- - Rate limit pruning operations
-- - Defect and system queries with status filtering
-- - Audit event queries for admin dashboards

-- ─── Systems Table Indexes ───────────────────────────────────────────────────

-- Composite index for system lookups by site with soft-delete filtering
-- Used by: SystemRepository.findBySiteId()
CREATE INDEX IF NOT EXISTS idx_systems_site_deleted ON systems(site_id, deleted_at);

-- Composite index for system type queries with soft-delete filtering
-- Used by: SystemRepository.findAllActive()
CREATE INDEX IF NOT EXISTS idx_systems_type_deleted ON systems(system_type, deleted_at);

-- Composite index for next due date queries (service scheduling)
-- Used by: Dashboard queries, scheduled job lookups
CREATE INDEX IF NOT EXISTS idx_systems_next_due_deleted ON systems(next_due_date, deleted_at);

-- ─── Defects Table Indexes ───────────────────────────────────────────────────

-- Composite index for defect lookups by system with soft-delete and status
-- Used by: DefectRepository.findBySystemId(), findOpenBlockingDefects()
CREATE INDEX IF NOT EXISTS idx_defects_system_status_deleted ON defects(system_id, status, deleted_at);

-- Composite index for certificate blocking queries
-- Used by: DefectRepository.blockCertificates(), maybeRestoreCertificates()
CREATE INDEX IF NOT EXISTS idx_defects_blocking_system_deleted ON defects(certificate_blocking, system_id, deleted_at);

-- Composite index for defect status queries with severity ordering
-- Used by: Admin defect dashboards, DefectRepository.findByStatus()
CREATE INDEX IF NOT EXISTS idx_defects_status_severity_deleted ON defects(status, severity, deleted_at);

-- Composite index for job-linked defect queries
-- Used by: DefectRepository.findByJobId()
CREATE INDEX IF NOT EXISTS idx_defects_job_deleted ON defects(job_id, deleted_at);

-- Composite index for created_at ordering (recent defects first)
-- Used by: All list queries with ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_defects_created_deleted ON defects(created_at DESC, deleted_at);

-- ─── Rate Limits Table Indexes ───────────────────────────────────────────────

-- Composite index for identifier + accessed_at (already exists from 0029, ensuring consistency)
-- Used by: consumeRateLimit(), pruneRateLimits()
CREATE INDEX IF NOT EXISTS idx_rate_limits_accessed_identifier ON rate_limits(accessed_at, identifier);

-- ─── Jobs Table Indexes ──────────────────────────────────────────────────────

-- Composite index for job status queries with system join optimization
-- Used by: JobRepository.findAllActive(), job status lookups
CREATE INDEX IF NOT EXISTS idx_jobs_status_system_deleted ON jobs(status, system_id, deleted_at);

-- Composite index for technician assignment queries
-- Used by: Technician dashboard, job assignment lookups
CREATE INDEX IF NOT EXISTS idx_jobs_technician_status ON jobs(assigned_technician_id, status);

-- Composite index for scheduled date queries
-- Used by: Dashboard queries, scheduling lookups
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_status ON jobs(scheduled_date DESC, status);

-- ─── Audit Events Table Indexes ──────────────────────────────────────────────

-- Composite index for actor-based audit queries
-- Used by: Admin audit exports, user activity history
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_outcome_created ON audit_events(actor_user_id, outcome, created_at DESC);

-- Composite index for entity-based audit queries
-- Used by: Entity history lookups, compliance audits
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_created ON audit_events(entity_type, entity_id, created_at DESC);

-- Composite index for event type queries with outcome filtering
-- Used by: Security monitoring, failure analysis
CREATE INDEX IF NOT EXISTS idx_audit_events_type_outcome_created ON audit_events(event_type, outcome, created_at DESC);

-- ─── Financial Records Table Indexes ─────────────────────────────────────────

-- Composite index for site-based financial queries
-- Used by: Finance dashboards, site financial history
CREATE INDEX IF NOT EXISTS idx_financial_site_payment_created ON financial_records(site_id, payment_status, created_at DESC);

-- Composite index for job-linked financial records
-- Used by: Job financial lookups, invoice generation
CREATE INDEX IF NOT EXISTS idx_financial_job_type ON financial_records(job_id, item_type);

-- Composite index for finance task status queries
-- Used by: Finance task dashboards, pending approval lists
CREATE INDEX IF NOT EXISTS idx_financial_task_status_site ON financial_records(finance_task_status, site_id);

-- ─── Certificates Table Indexes ──────────────────────────────────────────────

-- Composite index for system-based certificate queries with status
-- Used by: Certificate status checks, blocking defect handling
CREATE INDEX IF NOT EXISTS idx_certificates_system_status_deleted ON certificates(system_id, status, deleted_at);

-- Composite index for certificate blocking lookups
-- Used by: DefectRepository.blockCertificates(), maybeRestoreCertificates()
CREATE INDEX IF NOT EXISTS idx_certificates_blocked_by_defect ON certificates(blocked_by_defect_id, status);

-- ─── Jobs Table Additional Indexes ───────────────────────────────────────────

-- Covering index for job card submission queries
-- Used by: submit-jobcard.ts endpoint
CREATE INDEX IF NOT EXISTS idx_jobs_covering_submission ON jobs(id, system_id, status, assigned_technician_id, deleted_at);

-- ─── Migration Complete ──────────────────────────────────────────────────────
-- All composite indexes have been created for Phase 1 backend optimization.
-- Run this migration with: wrangler d1 execute kharon-portal --local --file migrations/0030_composite_indexes.sql
