# Kharon Portal Operations SOP

This SOP covers staging checks for `portal.tequit.co.za` and the later production cutover to `portal.kharon.co.za`. Do not store passwords, session cookies, API tokens or exported evidence in git.

## Monitoring Check

Run:

```powershell
npm run portal:monitor
```

The script checks:

- Public website home route returns HTTP 200.
- Portal login route returns HTTP 200.
- Protected admin dashboard redirects unauthenticated users to login.
- D1 responds to a simple `users` table query.
- R2 bucket metadata is reachable through Wrangler.

Output is written to `monitor-results/`, which is gitignored.

Frequency:

- Staging: run after each deployment and before user QA.
- Production: run daily during early rollout, then at least weekly, plus after Cloudflare, DNS, schema or portal changes.

Failure response:

- Public route failure: check Cloudflare Worker deployment, routes and DNS.
- Portal login failure: check Worker deployment, `SESSION_SECRET`, adapter output and Cloudflare routes.
- Protected redirect failure: treat as an auth middleware regression until proven otherwise.
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

- Staging: before schema migrations and before destructive seed resets.
- Production: before every schema migration, before bulk import, and on a recurring schedule approved by operations.

Restore drill:

- Keep at least one recent export available outside the repo.
- Test restore into a non-production D1 database before trusting the process for production recovery.
- Record the export timestamp, operator and restore-test outcome in the external operations log.

## R2 Evidence Backup

Wrangler can verify bucket availability, but full object mirroring should use Cloudflare R2 S3-compatible credentials stored outside the repo.

Minimum process:

1. Create scoped R2 credentials in Cloudflare for backup operations.
2. Store credentials in the operator password manager or secure runner environment, not in the repository.
3. Use an S3-compatible tool such as `rclone` or AWS CLI with the Cloudflare R2 endpoint.
4. Mirror `kharon-portal-storage` to approved backup storage.
5. Verify at least one recent jobcard PDF can be restored and opened.

Example shape only:

```powershell
# Configure credentials outside git first.
rclone sync kharon-r2:kharon-portal-storage secure-backup:kharon-portal-storage --checksum
```

Retention:

- Retention periods for jobcards, quote records, invoices and audit evidence must be approved before production use.
- Do not delete R2 evidence without a written retention decision.

## Production Cutover Notes

- Repeat the monitoring script after adding `portal.kharon.co.za`.
- Confirm D1 and R2 bindings point to the intended production resources.
- Confirm backup exports are taken before switching client operations from Tequit staging to Kharon production.

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

Admin and finance users can enrol an authenticator app at `/portal/account/mfa`.

Operational rules:

- MFA uses app-based 6-digit TOTP codes only in this foundation phase.
- Admins can mark admin and finance users as MFA-required from `/portal/admin/operations`.
- A user marked as MFA-required is redirected to MFA setup after password rotation and before normal dashboard access.
- Once MFA is enabled, login requires email, password and a valid authenticator code before issuing a session cookie.
- TOTP secrets are encrypted before storage and must never be copied into documentation, tickets or screenshots.
- If a user loses access to their authenticator, an admin must disable and re-issue MFA through a controlled support process after identity verification.
