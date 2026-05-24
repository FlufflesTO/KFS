# Kharon Portal Data Retention Policy

Status: production governance baseline.

This policy defines retention review rules for the Kharon portal. It does not create an automated deletion authority. No D1 row or R2 object may be deleted unless the deletion is approved through the operations process, checked against legal hold, and backed up where required.

## Scope

Covered records:

- Jobcards stored in R2 under `jobcards/`.
- Technician photo evidence stored in R2 under `job-evidence/` and indexed in D1.
- Site, system, maintenance request and dispatch records in D1.
- Financial records for quotes, invoices, payments and reconciliation.
- Audit events for authentication, RBAC, CSRF, rate limiting, record access and operational changes.
- Account security records, including password reset tokens and MFA state.

Excluded records:

- Public website content.
- Local backup exports in `backups/`.
- External accounting, email, ticketing or document systems not operated by this repository.

## Retention Matrix

| Record class | System of record | Minimum review threshold | Default action at threshold | Notes |
| --- | --- | ---: | --- | --- |
| Jobcard PDFs | R2 `jobcards/` | 7 years | Review, preserve unless approved for archive/delete | Treat as operational and commercial evidence. |
| Technician photo evidence | R2 `job-evidence/` and D1 `job_evidence_files` | 7 years | Review, preserve unless approved for archive/delete | Linked to jobcard and protected system evidence. |
| Financial records | D1 `financial_records` | 7 years | Preserve or export to approved accounting archive | Do not delete if linked to open disputes or audit activity. |
| Maintenance requests | D1 `maintenance_requests` | 5 years | Review closed records for archive/export | Preserve if linked to job or compliance issue. |
| Jobs and lifecycle history | D1 `jobs`, `systems` | 7 years | Preserve unless superseded by approved archive | Lifecycle dates support compliance and maintenance continuity. |
| Audit events | D1 `audit_events` | 2 years | Review for archive/export | Security audit evidence should remain available during active portal operation. |
| Password reset tokens | D1 `password_reset_tokens` | 90 days after expiry/use | Eligible for cleanup after backup review | Tokens store hashes only. Cleanup may be automated later. |
| Rate-limit counters | D1 `portal_rate_limits` | 30 days | Eligible for cleanup | Operational counter data only. |
| Inactive users | D1 `users` | 2 years after deactivation | Review for anonymisation or preservation | Preserve if linked to audit, job or finance evidence. |

## Legal Hold

Legal hold overrides retention thresholds.

Place records on hold when any of the following apply:

- Incident investigation.
- Client dispute.
- Insurance claim.
- Regulator, standards, tender, contract or audit request.
- Internal disciplinary or access-control investigation.
- Unresolved financial balance, quote, invoice or payment dispute.

Records under legal hold must not be deleted, anonymised or overwritten.

## Review Workflow

1. Run the non-destructive report:

   ```powershell
   npm run portal:retention:report
   ```

2. Save the generated report outside git in the approved operations evidence location.
3. Review aged record counts with operations, finance and management.
4. Confirm whether any records are under legal hold.
5. Take a D1 backup and confirm R2 evidence backup coverage before any approved cleanup.
6. Record the operator, date, reviewed counts, decision and approval reference in the external operations log.

## Deletion Rules

- Automated deletion is not enabled in this repository.
- R2 object deletion requires a matching D1 evidence review.
- D1 row deletion must not orphan client-visible records, jobcard links, invoice references or audit evidence.
- Any future purge script must default to dry-run mode and require an explicit approval reference.

## Production Cutover Requirement

Before moving from `portal.tequit.co.za` staging to `portal.kharon.co.za`, run and save:

- `npm run portal:backup:d1`
- R2 evidence backup/mirror check
- `npm run portal:retention:report`

Production rollout should not proceed if retention ownership, legal-hold process or backup location is unresolved.
