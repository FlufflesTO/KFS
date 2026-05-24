# Error Telemetry And Cloudflare Review Policy

## Purpose

Define how production failures, security events and service degradation are observed, reviewed and acted on for the Kharon portal and public website hosted on Cloudflare Workers.

---

## Structured Error Event Categories

Portal security events and errors are recorded in two D1 tables:

- `audit_events` — auth, CSRF, rate limiting, data changes and file access security history.
- `document_access_logs` — per-download records for jobcard PDFs and technician evidence photos.

### Category 1: Authentication Failures

Events to watch in `audit_events` where `event_type IN ('auth.login', 'auth.logout')` and `outcome = 'failure'`:

- Repeated login failures for the same email address — possible credential stuffing or brute force.
- Login failures immediately followed by a success — possible successful credential attack.
- Unusual login times or IP sources for known admin or finance users.

Threshold for review: 10 or more login failures within a 15-minute window from a single IP.

### Category 2: Rate Limit Blocks

Events in `audit_events` where `event_type = 'security.rate_limit'` and `outcome = 'blocked'`:

- Repeated blocks on `portal.login` — potential bot or credential spray.
- Blocks on `portal.admin.*` or `portal.finance.*` — potential automated scraping or abuse.
- Blocks on `public.contact` — potential contact form spam.

Threshold for review: more than 20 rate-limit blocks in one hour from a single IP.

### Category 3: CSRF Blocks

Events in `audit_events` where `event_type = 'security.csrf'` and `outcome = 'blocked'`:

- Any CSRF block on a production session is a meaningful signal — legitimate users should not trigger these.
- Clusters of CSRF failures may indicate session fixation attempts or automated form submission tools.

Threshold for review: any CSRF block on a finance or admin endpoint.

### Category 4: Document Access Failures

Events in `document_access_logs` where `outcome IN ('failure', 'blocked')`:

- Blocked attempts to download jobcard PDFs or evidence photos for sites the user does not own.
- Failure outcomes where `reason` contains `not found` — may indicate stale references or R2 storage gaps.
- Blocked attempts from client users trying to access records for unlinked sites.

Threshold for review: any `blocked` outcome on a document download endpoint.

### Category 5: API And Server Errors

Worker-level `console.error` calls and uncaught exceptions surface in Cloudflare Worker logs under **Logs > Real-time Logs** and **Analytics > Workers** in the Cloudflare dashboard.

Look for:
- HTTP 500 responses on portal API endpoints — indicates unhandled exceptions in server-side logic.
- HTTP 503 responses — D1 or R2 binding unavailable; may indicate infrastructure issues.
- D1 `prepare` or `bind` errors — usually a schema mismatch after a migration or a missing column.
- R2 `put` or `get` errors — indicates storage binding issues or key path mismatches.

Threshold for review: any 500 on a portal write endpoint; 3 or more 503s in a 10-minute window.

---

## Cloudflare Log Review Process

### Accessing Logs

1. Sign in to the Cloudflare dashboard at `dash.cloudflare.com`.
2. Select the relevant Cloudflare account (the account holding the Kharon Workers deployment).
3. Navigate to **Workers & Pages** → select the Kharon Worker.
4. Use **Logs → Real-time Logs** to stream live Worker output.
5. For historical query, use **Workers Analytics** → filter by date range and status code.

### Accessing D1 Query Results

Use Wrangler to query the D1 audit tables directly:

```sh
# View recent auth failures
npx wrangler d1 execute DB --remote --command "SELECT event_type, outcome, ip_hash, created_at FROM audit_events WHERE outcome = 'failure' ORDER BY created_at DESC LIMIT 50"

# View rate limit blocks in last 24 hours
npx wrangler d1 execute DB --remote --command "SELECT event_type, entity_id, metadata_json, created_at FROM audit_events WHERE event_type = 'security.rate_limit' AND created_at > datetime('now', '-1 day') ORDER BY created_at DESC LIMIT 100"

# View CSRF blocks
npx wrangler d1 execute DB --remote --command "SELECT event_type, entity_id, actor_user_id, created_at FROM audit_events WHERE event_type = 'security.csrf' ORDER BY created_at DESC LIMIT 50"

# View document access failures
npx wrangler d1 execute DB --remote --command "SELECT actor_user_id, actor_role, storage_path, outcome, reason, created_at FROM document_access_logs WHERE outcome IN ('failure', 'blocked') ORDER BY created_at DESC LIMIT 50"

# View contact form submissions
npx wrangler d1 execute DB --remote --command "SELECT id, name, email, request_type, submitted_at FROM contact_submissions ORDER BY submitted_at DESC LIMIT 50"
```

---

## Review Cadence

### Weekly Review Checklist

Run every Monday. Takes approximately 15 minutes.

- [ ] Query auth failure events from the past 7 days. Flag any IP with 10 or more failures.
- [ ] Query rate-limit block events. Flag any finance or admin endpoint with 5 or more blocks.
- [ ] Query CSRF block events. Investigate any block against an authenticated finance or admin user.
- [ ] Query document access blocked events. Follow up on any blocked client download.
- [ ] Review Cloudflare Worker analytics for 5xx error rates. Investigate any spike above baseline.
- [ ] Review contact form submissions. Forward new enquiries to the appropriate Kharon contact.
- [ ] Check portal monitoring output (`npm run portal:monitor`) for login and dashboard redirect failures.
- [ ] Confirm no new D1 or R2 errors appear in real-time Worker logs.

### Monthly Review Checklist

Run on the first working day of each month. Takes approximately 30 minutes.

- [ ] Summarise auth failure counts by IP range and time-of-day. Note any persistent patterns.
- [ ] Confirm rate-limit windows are correctly calibrated for observed legitimate traffic volumes.
- [ ] Review all CSRF blocks. If legitimate users are triggering CSRF errors, investigate session lifetime and cookie behaviour.
- [ ] Review document access log completeness: every jobcard PDF and evidence photo download should appear as a `success`, `failure` or `blocked` row.
- [ ] Confirm audit event coverage: spot-check 5 recent finance settlements and verify each has a corresponding `finance.payment_settled` audit event.
- [ ] Review contact submission pipeline. Confirm all received enquiries have been acknowledged.
- [ ] Run the retention report (`npm run portal:retention`) and flag any category approaching review thresholds.
- [ ] Confirm all D1 migrations have been applied to staging and production (`npx wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"`).
- [ ] Confirm no Worker secrets, API keys or password hashes appear in committed files (`git log --oneline -20`).

---

## Incident Escalation Thresholds

These thresholds trigger immediate action rather than scheduled review.

| Condition | Action |
|-----------|--------|
| Admin or finance account login from an unrecognised IP | Disable account, issue reset link, notify director |
| Finance endpoint CSRF block | Audit affected session, review recent finance records, rotate affected user session |
| 10+ login failures in 15 minutes on a known user email | Lock account temporarily, notify user through an out-of-band channel |
| R2 evidence or jobcard `get` returning 503 | Check Cloudflare status page, verify STORAGE binding in `wrangler.jsonc`, contact Cloudflare support if binding is healthy |
| D1 write returning 500 on jobcard closure | Do not retry blindly; query D1 for the job record state before resubmitting to avoid duplicate completion records |

---

## Limitations And Planned Improvements

- No automated alerting is configured. Weekly and monthly reviews are manual operator tasks until an alerting integration is approved.
- Cloudflare Worker logs are not persistently stored beyond the real-time stream window. For long-term log retention, consider enabling Cloudflare Logpush to an R2 bucket or external SIEM.
- `console.error` calls in Worker code are the primary server-side error signal. Structured error reporting (e.g. Sentry or Cloudflare Workers observability) would improve root-cause investigation speed and should be evaluated before production cutover at `kharon.co.za`.
- Contact form submissions are stored in D1 only. An email notification trigger is deferred to Phase 9 (provider-backed email delivery).
