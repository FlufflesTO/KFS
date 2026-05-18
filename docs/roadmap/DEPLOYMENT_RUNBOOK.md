# Deployment Runbook

## Scope

Deploy the static Astro website to Cloudflare Pages. The current test host is Tequit; the intended final public host is Kharon.

- Staging/test canonical domain: `https://www.tequit.co.za`
- Staging/test apex alias: `https://tequit.co.za`
- Staging/test portal host: `https://portal.tequit.co.za`
- Final production canonical domain: `https://www.kharon.co.za`
- Final production redirect domain: `https://kharon.co.za`
- Final production portal host: `https://portal.kharon.co.za`
- Cloudflare Pages project: `kharon-website`
- Node version: `>=22.12.0`
- Build output directory: `dist`
- Contact email: `admin@kharon.co.za` by default, with `connor@kharon.co.za` available in Google Workspace.

## Build Variables

Set these in Cloudflare Pages for each environment, or in PowerShell before a manual build:

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
- Contact page shows form and the configured `PUBLIC_CONTACT_EMAIL`.
- Header and footer include `Records Access` contact-flow CTAs while the portal host is reserved.
- `dist/_headers` and `dist/_redirects` are present.
- Domain-level apex/www redirects are configured through Cloudflare Redirect Rules or Bulk Redirects, not Pages `_redirects`.

## Cloudflare Pages Deployment

### Project Settings

- Framework preset: Astro
- Project name: `kharon-website`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Production branch: main release branch
- Node version: `22.22.1` or any version satisfying `>=22.12.0`

### Steps

1. Create the Pages project if it does not already exist:
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
6. Validate `_headers` from `public/_headers` applies in the preview build. The `_redirects` file is kept only for path-level redirects; Cloudflare Pages does not support domain-level redirects in `_redirects`.
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

### Portal DNS

`portal.tequit.co.za` is attached to the `kharon-website` Pages project. If Cloudflare shows `CNAME record not set`, add this DNS record in the `tequit.co.za` zone:

- Type: `CNAME`
- Name: `portal`
- Target: `kharon-website.pages.dev`
- Proxy status: proxied
- TTL: auto

After the DNS record is saved, re-check and retry Pages validation:

```powershell
npm run cloudflare:retry-portal
npm run cloudflare:check-portal
```

If direct `npx wrangler login` fails with `You are logged in with an API Token`, the shell has `CLOUDFLARE_API_TOKEN` set. Either use the npm scripts above or clear it for the current PowerShell session:

```powershell
Remove-Item Env:CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
npx wrangler login
```

### Final Kharon DNS

When moving from Tequit staging to Kharon production, add the Kharon custom domains to Cloudflare Pages and create DNS records in the `kharon.co.za` zone:

- `www` -> `kharon-website.pages.dev`
- apex `kharon.co.za` -> Pages apex/custom-domain target shown by Cloudflare
- `portal` -> the separate portal app target when that app exists

Keep the public-site portal CTA on `/contact#portal-access` until `portal.kharon.co.za` is a separate deployed portal.

Final cutover build and deploy:

```powershell
npm run build:production:kharon
npm run deploy:cloudflare
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
- Confirm the active portal host resolves, or remains intentionally reserved.
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
   - Submit button
5. Browser console has no hydration errors on fresh load.
6. Latest hardening audit is recorded in `docs/roadmap/HARDENING_AUDIT.md`.

## Rollback

If production regression is detected:

1. Re-point production alias/domain to last known good deployment.
2. Confirm critical routes and contact path recover.
3. Open fix branch and patch issue.
4. Re-run pre-deploy gate and deploy again.
