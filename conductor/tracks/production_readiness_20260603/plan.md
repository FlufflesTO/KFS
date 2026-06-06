# Implementation Plan: Production Readiness

## Phase 1: Security & Identity Reset
- [x] Task: Create Production Safety Reset script for password rotation and MFA. [checkpoint: 20260603]
- [ ] Task: Execute Safety Reset on remote database (Requires Approval).
- [ ] Task: Ensure unique user accounts are enforced (auditing shared accounts).
- [x] Task: Require MFA for admin and finance roles. [checkpoint: 20260603]
- [x] Task: Formalize D1/R2 backup procedures and documentation (BACKUP_RECOVERY_SOP.md). [checkpoint: 20260603]
- [x] Task: Audit all secrets in Cloudflare to ensure none remain in code. [checkpoint: 20260603]
- [x] Task: Hardened CI/CD to preserve D1 backups as artifacts. [checkpoint: 20260603]

## Phase 2: Environment & Deployment
- [x] Task: Add QA banner to portal and website. [checkpoint: 20260603]
- [x] Task: Confirm deployment command shape for split architecture. [checkpoint: 20260603]
- [x] Task: Verify remote D1 migration `0035_staff_hr.sql` readiness. [checkpoint: 20260603]

## Phase 3: Policy & Sign-off
- [ ] Task: Complete HR production policy gates.
- [ ] Task: Complete business/POPIA sign-off for analytics.
- [ ] Task: Final security audit verification.
- [ ] Task: Director sign-off for domain cutover.

