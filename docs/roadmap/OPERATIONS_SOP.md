# Kharon Portal Operations SOP

This SOP covers production checks for `portal.kharon.co.za`. Do not store passwords, session cookies, API tokens or exported evidence in git.

## Monitoring Check

Run:

```powershell
npm run portal:monitor
```

The script checks:

- Public website home route returns HTTP 200.
- Portal login route returns HTTP 200.
- Protected admin dashboard redirects unauthenticated users to login.
- Runtime security headers are present on public, portal, API JSON and protected redirect responses.
- D1 responds to a simple `users` table query.
- R2 bucket metadata is reachable through Wrangler.

Output is written to `monitor-results/`, which is gitignored.

Latest production evidence:

- 2026-05-25: `npm run portal:monitor` passed after Cloudflare deployment `e9a1820c-fb1e-4264-b685-4753013fc157`. Public home, portal login, protected dashboard redirect, public/portal/API/redirect security-header checks, D1 availability and R2 availability all passed.

Frequency:

- Run daily during early rollout, then at least weekly, plus after Cloudflare, DNS, schema or portal changes.

Failure response:

- Public route failure: check Cloudflare Worker deployment, routes and DNS.
- Portal login failure: check Worker deployment, `SESSION_SECRET`, adapter output and Cloudflare routes.
- Protected redirect failure: treat as an auth middleware regression until proven otherwise.
- Security header failure: treat as a middleware or deployment regression until public, portal, API and redirect responses are all covered.
- D1 failure: check D1 binding `DB`, database availability and Wrangler authentication.
- R2 failure: check R2 binding `STORAGE`, bucket availability and Wrangler authentication.

## D1 Backup

Run:

```powershell
npm run portal:backup:d1
```

The script runs:

```powershell
npx wrangler d1 export kharon-portal --remote --output backups/<timestamp>.sql --skip-confirmation
```

Output is written to `backups/`, which is gitignored.

Minimum cadence:

- Before every schema migration, before bulk import, and on a recurring schedule approved by operations.

Restore drill:

- Keep at least one recent export available outside the repo.
- Test restore into a non-production D1 database before trusting the process for production recovery.
- Record the export timestamp, operator and restore-test outcome in the external operations log.

Latest production evidence:

- 2026-05-25: `npm run portal:backup:d1` completed against remote `kharon-portal`; export and manifest were written under gitignored `backups/`.
- 2026-05-25: Remote `d1_migrations` was reconciled for migrations `0001_kharon_portal.sql` through `0017_certificates.sql`; `npx wrangler d1 migrations list kharon-portal --remote` returned `No migrations to apply`.
- 2026-05-25: A fresh D1 export was created before applying migration `0012_client_site_access.sql`; Wrangler applied the migration remotely and then reported no pending migrations.

## R2 Evidence Backup

Wrangler can verify bucket availability, but full object mirroring should use Cloudflare R2 S3-compatible credentials stored outside the repo.

Minimum process:

1. Create scoped R2 credentials in Cloudflare for backup operations.
2. Store credentials in the operator password manager or secure runner environment, not in the repository.
3. Use an S3-compatible tool such as `rclone` or AWS CLI with the Cloudflare R2 endpoint.
4. Mirror `kharon-portal-storage` to approved backup storage.
5. Verify at least one recent jobcard PDF can be restored and opened.

Latest production evidence:

- 2026-05-25: R2 restore drill created a temporary object under `restore-drills/`, downloaded it, verified matching SHA-256 hashes, and deleted the temporary object. Bucket availability remained healthy afterwards.

Example shape only:

```powershell
# Configure credentials outside git first.
rclone sync kharon-r2:kharon-portal-storage secure-backup:kharon-portal-storage --checksum
```

Retention:

- Retention periods for jobcards, quote records, invoices and audit evidence must be approved before production use.
- Do not delete R2 evidence without a written retention decision.

## Production Routing Notes

- Repeat the monitoring script after any DNS, route or custom-domain change.
- Confirm D1 and R2 bindings point to the intended production resources.
- Confirm backup exports are taken before any production schema or bulk data change.

## User Onboarding SOP

Use this process when creating any technician, admin, finance or client user. Do not create shared accounts for production use.

Prerequisites:

- Confirm the requested role: `tech`, `admin`, `finance` or `client`.
- Confirm whether the user must be mapped to a client site.
- Confirm whether MFA must be required. MFA should be required for admin, finance and technician accounts unless management approves an exception.
- Confirm the delivery channel for the first reset link or temporary credential outside the repository.

Admin steps:

1. Sign in as an admin user.
2. Open `/portal/admin/operations`.
3. Create or verify the relevant client site before creating a mapped client user.
4. Create the user with a unique corporate email address.
5. Select the correct role.
6. Map client users to the correct site only. Do not map technician, admin or finance users to a client site unless a specific workflow requires it.
7. Set `Force password change` for every new user.
8. Set `Require MFA` for admin, finance and technician users where required.
9. Save the user and confirm the account appears in the user list.
10. Issue a reset link if password reset delivery is the chosen onboarding path.
11. Deliver the reset link or temporary credential through the approved external channel only.
12. Record the onboarding action in the external operations log with operator, user email, role, site mapping and MFA requirement. Do not record passwords.

Acceptance checks:

- The user can sign in.
- Forced password rotation redirects to `/portal/account/password`.
- Admin, finance or technician users marked MFA-required redirect to `/portal/account/mfa`.
- The user reaches only the dashboard allowed by their role.
- Client users see only the mapped site.

Deactivation:

1. Open `/portal/admin/operations`.
2. Untick `Active` for the user.
3. Save the user record.
4. Run the role QA checklist item for disabled user login.
5. Record deactivation in the external operations log.

Role changes:

- Treat role changes as access-control changes.
- Confirm business approval before changing a user to `admin` or `finance`.
- Re-run RBAC QA for that user after changing role.
- Require password rotation and MFA review after privileged role changes.

## Dispatch And Jobcard SOP

Use this process for scheduling and closing operational dispatches.

Admin scheduling:

1. Confirm the client site exists.
2. Confirm the protected system exists and has the correct system type, coverage area, manufacturer and next due date.
3. Open `/portal/admin/dashboard` to review the client request queue where applicable.
4. Convert a client request to a scheduled dispatch, or open `/portal/admin/operations` and create a job manually.
5. Assign the technician if known.
6. Set the scheduled date.
7. Use the job type to describe the operational reason: maintenance, fault response, compliance inspection or follow-up.
8. Keep site notes factual and relevant to field work.
9. Confirm the job appears in the technician dashboard.

Technician closure:

1. Technician signs in and opens `/portal/tech/dashboard`.
2. Technician logs site arrival using the "Log site arrival" form (date/time, optional GPS, on-site contact, arrival notes).
3. Technician starts the job if it is still scheduled.
4. Technician selects the fault or work category.
5. Technician records work comments, parts used and follow-up actions.
6. Technician attaches up to 3 relevant evidence photos where needed.
7. Technician captures client or responsible-person signature.
8. Technician submits the completed jobcard only after confirming the browser is online and stable.
9. Technician waits for the completion confirmation and document path.

Admin exception handling:

- If the technician cannot submit due to signal problems, retain local photos and notes and retry from stable connectivity.
- If a job is closed against the wrong system, do not delete evidence manually. Record the issue, preserve the generated jobcard and create a corrective admin note or follow-up dispatch.
- If evidence photos are wrong or sensitive, escalate before sharing with a client. Do not expose raw R2 paths outside controlled portal routes.
- If a generated PDF is missing, check `jobs.documentation_path`, R2 object availability and `document_access_logs`.

Finance handoff:

- Completed jobcards automatically create or support finance records where implemented.
- Finance should review `/portal/finance/dashboard` after job completion.
- Payment capture must use approved references; do not mark records settled without supporting payment evidence.

## Portal Access Incident Response

Use this process for suspected access issues, credential compromise, role leakage or document-access anomalies.

Severity guide:

- Critical: admin/finance account compromise, unauthorized document access, RBAC bypass, session or CSRF failure.
- High: client can see another client's records, technician can close another technician's job, disabled user can login.
- Medium: repeated login failures, MFA lockout, missing jobcard document, failed R2 access.
- Low: individual password reset, user confusion or expected dashboard redirect issue.

Immediate containment:

1. Disable the affected user in `/portal/admin/operations` where appropriate.
2. If the issue is privileged, rotate the user's password and reset MFA.
3. Preserve logs. Do not delete `audit_events`, `document_access_logs`, jobcards or evidence.
4. Run `npm run portal:monitor`.
5. Run the relevant role QA checks with external production QA credentials where safe.
6. Export D1 before any manual corrective SQL if production data is involved.

Investigation checklist:

- Identify user ID, role, time window and affected route.
- Check `audit_events` for login, MFA, password, CSRF and rate-limit entries.
- Check `document_access_logs` for successful, blocked and failed document access.
- Confirm the user's `site_id`, `role`, `is_active`, `mfa_required` and `mfa_enabled` fields.
- Confirm route behavior from the QA checklist.
- Confirm no secrets, reset links or session tokens were pasted into tickets or source files.

Recovery:

- Re-enable users only after the root cause is understood.
- Issue a new reset link if password confidence is lost.
- Require MFA for affected admin or finance users.
- Record the incident, action taken and residual risk in the external operations log.

Escalation:

- Escalate to management before notifying clients or sharing document access logs.
- Escalate immediately if any client could view another client's records.
- Treat any suspected legal or contractual reporting requirement as a management/legal decision, not a developer-only decision.

## Production Readiness Checklist

Use this checklist before enabling broader operational use of `portal.kharon.co.za`.

DNS and routing:

- [ ] `portal.kharon.co.za` is added as a custom domain on the Cloudflare Worker/Pages target.
- [ ] DNS is proxied through Cloudflare.
- [ ] SSL certificate is active.
- [ ] `https://portal.kharon.co.za/portal/login` returns HTTP 200.
- [ ] `https://portal.kharon.co.za/portal/admin/dashboard` redirects unauthenticated users to login.

Configuration:

- [ ] Production `SESSION_SECRET` is set and at least 32 characters.
- [ ] Production `CSRF_SECRET` or equivalent secret is set and at least 32 characters.
- [ ] Production MFA encryption secret is set if separate from session secrets.
- [ ] D1 binding `DB` points to the intended production database.
- [ ] R2 binding `STORAGE` points to the intended production bucket.
- [ ] No reset links or temporary credentials are committed.

Data:

- [ ] D1 backup/export taken before cutover.
- [ ] R2 backup or restore verification completed.
- [ ] Production users are unique per person.
- [ ] Shared credentials are removed or disabled.
- [ ] Admin and finance MFA requirement is reviewed.
- [ ] Client users are mapped only to approved sites.

Validation:

- [ ] `npm run build` passes.
- [ ] `npm run audit:site` passes.
- [ ] `npm run portal:monitor` passes against the production base URL.
- [ ] `npm run portal:qa:roles -- -BaseUrl "https://portal.kharon.co.za"` is executed with external QA credentials.
- [ ] Manual `docs/qa/PORTAL_ROLE_QA_CHECKLIST.md` is completed.
- [ ] Document download and document access logging are verified.

Go/no-go:

- [ ] Critical and high incidents are closed.
- [ ] Backup location and restore owner are confirmed.
- [ ] Operations owner accepts the onboarding, dispatch and incident procedures.
- [ ] Rollback path is documented: disable the affected production route or restore the last known good deployment while preserving D1/R2 evidence.

## Field Photo Evidence And Poor-Signal Expectations

Technicians may attach up to 3 job evidence photos during jobcard closure. Evidence should be limited to relevant operational proof such as panel state, device condition, labels, defects, completed corrective work or protected-room context.

Current limits:

- Maximum 3 images per submitted jobcard.
- Accepted formats: JPEG, PNG and WebP.
- Maximum size: 1.5 MB per image.
- Evidence is stored in R2 under `job-evidence/` and indexed in D1.

Poor-signal operating expectation:

- The current portal is an online workflow. It does not yet provide full offline queueing or background sync.
- If signal is unstable, technicians should capture photos on the device first, complete the jobcard once a stable connection is available and avoid closing the browser before submission completes.
- If submission fails after field work is complete, the technician should retain local photos and notes, then retry when connected or escalate to admin for manual dispatch closure.
- Future offline support should add a local draft queue, upload retry state and clear user warnings before it is treated as production offline-capable.

## Password Reset Operations

Administrators can issue a password reset link from `/portal/admin/operations`.

Controls:

- Reset tokens are generated randomly and only the SHA-256 hash is stored in D1.
- Reset links expire after 1 hour.
- Reset tokens are single-use.
- Reset completion forces the account through the existing password rotation flow after login.
- Reset link creation and reset completion are audit logged.

Operational rule:

- Do not send reset links through public chat or commit them to files.
- Until an email provider is selected, deliver reset links only through an approved external channel controlled by Kharon operations.
- If a reset link is exposed or sent to the wrong recipient, issue a fresh reset link and treat the old one as compromised until it expires.

## MFA Operations

Admin, finance and technician users can enrol an authenticator app at `/portal/account/mfa`.

Operational rules:

- MFA uses app-based 6-digit TOTP codes only in this foundation phase.
- Admins can mark admin, finance and technician users as MFA-required from `/portal/admin/operations`.
- A user marked as MFA-required is redirected to MFA setup after password rotation and before normal dashboard access.
- Once MFA is enabled, login requires email, password and a valid authenticator code before issuing a session cookie.
- TOTP secrets are encrypted before storage and must never be copied into documentation, tickets or screenshots.
- If a user loses access to their authenticator, an admin must disable and re-issue MFA through a controlled support process after identity verification.

## Portal Authentication Recovery Notes

2026-05-31 recovery baseline:

- Cloudflare Worker runtime bindings must resolve through `cloudflare:workers`; `DB`, `STORAGE`, `SESSION_SECRET` and `MFA_SECRET` are required for portal auth.
- The installed Cloudflare adapter must not be configured with unsupported options; CI blocks deploys when adapter types drift.
- Login is handled through the portal login page script so successful JSON API responses set the session cookie and redirect to the correct role dashboard or required setup page.
- The auth API blocks inactive or soft-deleted users before password verification succeeds.
- Middleware re-checks the live user record on each authenticated portal request so deactivated users, changed roles, password-rotation flags and MFA flags take effect without waiting for the session token to expire.
- Admin user controls support password reset links, direct password changes, user deactivation and MFA reset for eligible privileged roles.

## Admin CSV Import And Export

Admin CSV controls are available from `/portal/admin/operations`.

Export controls:

- `Export users` produces a read-only user inventory without password hashes or MFA secrets.
- `Export sites` produces site master data.
- `Export systems` produces protected-system master data linked by `site_id`.

Import controls:

- Site import requires the exact header: `id,owner_company_name,physical_address,site_contact_person,site_contact_email,site_contact_phone,billing_emails`.
- System import requires the exact header: `id,site_id,system_type,coverage_area,manufacturer,model_reference,next_due_date`.
- A blank `id` creates a new record. An existing `id` updates that record.
- Imports are limited to 250 rows per request and return row-level success or failure details.
- Systems imported via CSV receive the default 6-month service interval (`service_interval_months = 6`). To set a custom interval, edit the system record individually in `/portal/admin/operations` after import.
- User bulk import is intentionally not enabled until a controlled temporary-password and reset-link delivery process is approved.
- Operators should export current data before any import, validate `site_id` values for system imports and retain the source CSV in the approved internal evidence location outside git.

## Error Telemetry Review

The controlling policy is `docs/roadmap/ERROR_TELEMETRY_POLICY.md`.

Run D1 audit queries as documented in that file to review auth failures, rate-limit blocks, CSRF blocks and document access failures.

Minimum cadence:

- Weekly: 15-minute review using the weekly checklist in the policy.
- Monthly: 30-minute review using the monthly checklist.

Contact form submissions are stored in `contact_submissions` and must be reviewed and forwarded manually until a Phase 9 email notification is configured:

```powershell
npx wrangler d1 execute DB --remote --command "SELECT id, name, email, request_type, submitted_at FROM contact_submissions ORDER BY submitted_at DESC LIMIT 20"
```

## Retention Review

The controlling policy is `docs/roadmap/DATA_RETENTION_POLICY.md`.

Run:

```powershell
npm run portal:retention:report
```

The script is non-destructive. It reports records older than the current review thresholds and writes output to `retention-reports/`, which is gitignored.

Minimum cadence:

- Quarterly, before any evidence cleanup decision and before major system migrations.

Review rules:

- Legal hold overrides all retention thresholds.
- Take a D1 backup and confirm R2 evidence backup before approving any cleanup.
- Do not delete R2 jobcards or photo evidence from Cloudflare without a matching D1 review and written approval reference.
- Password reset tokens and rate-limit counters are eligible for future automated cleanup, but no purge automation is currently enabled.

## Document Access Review

Sensitive record downloads are logged to `document_access_logs` in D1.

Logged fields include:

- Actor user ID and role.
- Site ID where the document can be mapped to a site.
- R2 storage path.
- Document type.
- Outcome: `success`, `failure` or `blocked`.
- IP hash and user-agent.
- Failure or blocked reason where applicable.

Review expectations:

- During role QA, confirm successful jobcard and evidence downloads create success rows.
- Confirm unauthorized document access attempts create blocked or failure rows.
- During production, review document access logs during client disputes, audit requests, suspected credential compromise and evidence-retention reviews.
- Do not expose raw document access exports to clients without management approval and any required redaction.
