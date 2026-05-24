# Deployment Runbook

## Scope

Deploy the Astro website and SSR portal to Cloudflare's serverless runtime. The current test host is Tequit; the intended final public host is Kharon.

- Staging/test canonical domain: `https://www.tequit.co.za`
- Staging/test apex alias: `https://tequit.co.za`
- Staging/test portal host: `https://portal.tequit.co.za`
- Final production canonical domain: `https://www.kharon.co.za`
- Final production redirect domain: `https://kharon.co.za`
- Final production portal host: `https://portal.kharon.co.za`
- Cloudflare Worker/Pages application: `kharon-website`
- Node version: `>=22.12.0`
- Build output directory: `dist`
- Contact email: `admin@kharon.co.za` by default, with `connor@kharon.co.za` available in Google Workspace.

## Build Variables

Set these in the Cloudflare deployment environment for each environment, or in PowerShell before a manual build:

### Tequit staging/test

```powershell
$env:PUBLIC_SITE_URL="https://www.tequit.co.za"
$env:PUBLIC_PORTAL_URL="https://portal.tequit.co.za"
$env:PUBLIC_CONTACT_EMAIL="admin@kharon.co.za"
```

### Final Kharon production

```powershell
$env:PUBLIC_SITE_URL="https://www.kharon.co.za"
$env:PUBLIC_PORTAL_URL="https://portal.kharon.co.za"
$env:PUBLIC_CONTACT_EMAIL="admin@kharon.co.za"
```

## Pre-Deploy Gate

Run from PowerShell:

```powershell
cd C:\Users\User\Desktop\Astro\kharon-website
npm install
npm run build:staging
npm audit --omit=dev
npx wrangler --version
npx wrangler pages deploy --help
npm run cloudflare:whoami
npm run cloudflare:list-projects
npm run cloudflare:domains
```

Gate requirements:

- Build succeeds without route failures.
- Audit reports `0 vulnerabilities`.
- `robots.txt` and `sitemap.xml` are present in build output.
- `404.html` is present and contains `noindex, nofollow`.
- Contact page shows form with Name, Email, Request Type and Message fields and a Submit button. Form uses `/api/contact` POST (not `mailto:`).
- Header and footer include `Access Records` CTAs pointing to the active portal login.
- `dist/_headers` and `dist/_redirects` are present.
- Domain-level apex/www redirects are configured through Cloudflare Redirect Rules or Bulk Redirects, not Pages `_redirects`.

## Cloudflare Deployment

### Project Settings

- Framework/runtime: Astro with `@astrojs/cloudflare`
- Project name: `kharon-website`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Production branch: main release branch
- Node version: `22.22.1` or any version satisfying `>=22.12.0`

### Steps

1. Create or confirm the Cloudflare application if it does not already exist:
   ```powershell
   npm run cloudflare:create-project
   ```
2. Confirm Cloudflare uses `wrangler.jsonc`.
3. Set build/output configuration.
4. Authenticate with OAuth. The repo script ignores a stale `CLOUDFLARE_API_TOKEN` for the command process so Wrangler does not use an invalid token:
   ```powershell
   npm run auth:cloudflare
   ```
5. Deploy preview:
   ```powershell
   npm run build:staging
   npm run deploy:cloudflare:preview
   ```
6. Validate security headers and path-level redirects. Cloudflare `_redirects` does not replace zone-level apex/www redirect rules.
7. Attach domains:
   For Tequit staging:
   - `www.tequit.co.za`
   - `tequit.co.za`
   - `portal.tequit.co.za`

   For final Kharon production:
   - `www.kharon.co.za`
   - `kharon.co.za`
   - `portal.kharon.co.za`
8. Deploy production:
   ```powershell
   npm run build:staging
   npm run deploy:cloudflare
   ```
   The production script deploys with `--branch main` so custom domains attached to the production branch receive the new build.
9. Promote to production if using a dashboard-managed preview first.

### Domain Redirects

Cloudflare Pages `_redirects` does not support host/domain-level redirects. Configure canonical forwarding in Cloudflare:

- Tequit staging: redirect `tequit.co.za/*` to `https://www.tequit.co.za/$1`, preserving path and query string.
- Final Kharon production: redirect `kharon.co.za/*` to `https://www.kharon.co.za/$1`, preserving path and query string.

Use Cloudflare Redirect Rules or Bulk Redirects for this. Do not add full-domain rules to `public/_redirects`; they will not be enforced by Pages.

### Portal DNS And Routing

`portal.tequit.co.za`, `www.tequit.co.za` and `tequit.co.za` are attached to the SSR Worker deployment. Do not leave public traffic on the old static Pages deployment, otherwise public navigation can drift from the portal-backed SSR build.

Current Tequit Worker routes in `wrangler.jsonc`:

- `tequit.co.za/*`
- `www.tequit.co.za/*`
- `portal.tequit.co.za/*`

Expected checks:

```powershell
curl.exe -I https://www.tequit.co.za/contact/
curl.exe -I https://portal.tequit.co.za/portal/login
curl.exe -I https://portal.tequit.co.za/portal/tech/dashboard
```

Expected results:

- `/portal/login` returns `200`.
- Protected dashboards return `302` to `/portal/login?...` when unauthenticated.
- Public `Access Records` links render `https://portal.tequit.co.za/portal/login`.

If `www.tequit.co.za` or `portal.tequit.co.za` serves stale Pages output, it is attached to the wrong Cloudflare application. Remove the affected custom domain from the Pages/static app or add a Worker route/custom domain on the Worker deployment.

After the DNS/custom domain is saved, re-check routing:

```powershell
curl.exe -I https://portal.tequit.co.za/portal/login
```

If direct `npx wrangler login` fails with `You are logged in with an API Token`, the shell has `CLOUDFLARE_API_TOKEN` set. Either use the npm scripts above or clear it for the current PowerShell session:

```powershell
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
npx wrangler login
```

### Final Kharon DNS

When moving from Tequit staging to Kharon production, add the Kharon custom domains to Cloudflare and create DNS records in the `kharon.co.za` zone:

- `www` -> `kharon-website.pages.dev`
- apex `kharon.co.za` -> Pages apex/custom-domain target shown by Cloudflare
- `portal` -> the Worker/SSR portal target

When moving to `portal.kharon.co.za`, update `PUBLIC_PORTAL_URL`, attach the new custom domain to the Worker/SSR deployment, and verify login plus protected dashboard redirects before announcing the cutover.

Final cutover build and deploy:

```powershell
npm run build:production:kharon
npm run deploy:cloudflare
```

### Portal Serverless Backend

The portal is now built as an Astro 6 SSR bundle for Cloudflare's serverless runtime. Validate before deployment:

```powershell
npm run validate:site
```

Apply the D1 schema locally:

```powershell
npx wrangler d1 execute kharon-portal --local --file=schema.sql
```

Apply the D1 schema remotely:

```powershell
npx wrangler d1 execute kharon-portal --remote --file=schema.sql
```

Apply incremental migrations when upgrading an existing database. Apply each pending migration in order:

```powershell
npx wrangler d1 execute DB --local --file=migrations/0001_kharon_portal.sql
npx wrangler d1 execute DB --remote --file=migrations/0001_kharon_portal.sql
```

Current migrations and their scope:

| File | Scope |
|------|-------|
| `0001_kharon_portal.sql` | Initial portal schema |
| `0002_portal_operations.sql` | Admin CRUD operations |
| `0003_client_requests.sql` | Maintenance requests |
| `0004_request_dispatch_link.sql` | Request-to-job linking |
| `0005_job_evidence_files.sql` | Photo evidence metadata |
| `0006_password_reset_tokens.sql` | Password reset |
| `0007_user_mfa.sql` | TOTP MFA |
| `0008_document_access_logs.sql` | Document access ledger |
| `0009_revoked_sessions.sql` | Session token revocation |
| `0010_system_service_interval.sql` | Configurable service intervals |
| `0011_contact_submissions.sql` | Public contact form storage |

For a fresh database, apply `schema.sql` first (full schema including all migrations). For an existing database, identify the highest applied migration and apply only the subsequent files in order.

Applied to staging D1 as of 2026-05-25: all migrations through `0011`.

Generate a PBKDF2 password hash before inserting users:

```powershell
npm run portal:hash-password -- "replace-with-a-strong-password"
```

Required Cloudflare bindings:

- D1 binding: `DB`
- D1 database: `kharon-portal`
- D1 database id: `327db922-1c44-438d-8328-af7ba33e9ae0`
- R2 binding: `STORAGE`
- R2 bucket: `kharon-portal-storage`
- Session cookie: `kharon_session_token`
- Required secret: `SESSION_SECRET`

Allowed portal roles:

- `tech`
- `admin`
- `client`
- `finance`

Admin operations route:

- `/portal/admin/operations`
- Requires `admin` role.
- Manages users, sites, protected systems and scheduled jobs.
- User records are deactivated instead of hard-deleted to preserve audit history.
- Sites, systems and jobs are created or updated, not destructively deleted.

Live smoke checks:

```powershell
curl.exe -I https://portal.tequit.co.za/portal/login
curl.exe -I https://portal.tequit.co.za/portal/tech/dashboard
```

Authenticated dashboard smoke check:

```powershell
Set-Content -Path .\auth-test.json -Value '{"email":"tech@kharon.co.za","password":"<enter QA password supplied outside the repo>"}'
curl.exe -s -c .\portal-cookies.txt -X POST https://portal.tequit.co.za/portal/api/auth -H "Content-Type: application/json" --data-binary "@auth-test.json"
curl.exe -I -b .\portal-cookies.txt https://portal.tequit.co.za/portal/tech/dashboard
Remove-Item .\auth-test.json,.\portal-cookies.txt -ErrorAction SilentlyContinue
```

Expected authenticated result: `/portal/tech/dashboard` returns `200`.

Logout smoke check:

```powershell
curl.exe -i -b .\portal-cookies.txt -c .\portal-cookies-after.txt -X POST https://portal.tequit.co.za/portal/api/logout -H "Origin: https://portal.tequit.co.za"
curl.exe -I -b .\portal-cookies-after.txt https://portal.tequit.co.za/portal/tech/dashboard
```

Expected result: logout returns `200` and the next dashboard request returns `302` to login.

Audit and rate-limit checks:

```powershell
npx wrangler d1 execute kharon-portal --remote --command "SELECT event_type, outcome, COUNT(*) AS count FROM audit_events GROUP BY event_type, outcome ORDER BY event_type, outcome;"
npx wrangler d1 execute kharon-portal --remote --command "SELECT scope, COUNT(*) AS keys, MAX(attempts) AS max_attempts FROM portal_rate_limits GROUP BY scope;"
```

### Google Workspace Email DNS

Because Kharon uses Google Workspace for `admin@kharon.co.za` and `connor@kharon.co.za`, email DNS belongs on the `kharon.co.za` zone, not the temporary `tequit.co.za` test zone unless Tequit also needs mail.

Add Google Workspace's current required records:

- MX for receiving mail: `@`, priority `1`, target `smtp.google.com`.
- SPF TXT at `@`: `v=spf1 include:_spf.google.com ~all` if Google Workspace is the only sender.
- DKIM TXT generated inside Google Admin for `kharon.co.za`.
- DMARC TXT at `_dmarc.kharon.co.za`, starting with monitoring mode such as `v=DMARC1; p=none; rua=mailto:admin@kharon.co.za`.

Do not add a second SPF record. If another sender is added later, merge it into the same SPF TXT value.

### Post-Deploy Checks

- Verify response headers include security policy from `_headers`.
- Confirm the active environment's canonical and redirect domains behave as expected.
- Confirm the active portal host resolves and protected dashboard routes redirect to login when unauthenticated.
- Confirm no broken assets on homepage and solution pages.
- Validate contact flow and portal links.
- `/sitemap.xml` returns XML using the configured canonical domain.
- `/robots.txt` returns a sitemap URL using the configured canonical domain.
- The non-canonical apex domain redirects at the Cloudflare zone layer, or is documented as an intentional staging alias.

## Regression Smoke Checklist

Run after every production deployment:

1. `/` renders and includes:
   - Engineering-led fire protection
   - Operational Routing
   - Technical Proof
2. `/gas-suppression`, `/fire-detection`, `/compliance-maintenance`, `/critical-infrastructure`, `/emergency-support`, `/security-systems`, `/industries`, `/about`, `/contact` all return 200.
3. Header dropdown and mobile menu links resolve correctly.
4. Contact page contains:
   - Name input
   - Email input
   - Request Type select
   - Message textarea
   - Submit button (submits to `/api/contact`, not `mailto:`)
   - Successful submission shows inline confirmation; no email client is required
5. Browser console has no hydration errors on fresh load.
6. Latest hardening audit is recorded in `docs/roadmap/HARDENING_AUDIT.md`.

## Rollback

If production regression is detected:

1. Re-point production alias/domain to last known good deployment.
2. Confirm critical routes and contact path recover.
3. Open fix branch and patch issue.
4. Re-run pre-deploy gate and deploy again.
