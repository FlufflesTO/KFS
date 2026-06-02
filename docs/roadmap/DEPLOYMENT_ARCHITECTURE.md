# Deployment Architecture

## Two-Project Structure

The Kharon codebase deploys from a single Astro build to two separate Cloudflare Workers projects.

### kfs-website

- **Config:** `wrangler.website.jsonc`
- **Routes:** `tequit.co.za/*`, `www.tequit.co.za/*`
- **Bindings:** None (public marketing site — no D1 or R2 required)
- **Cron:** None

### kfs-portal

- **Config:** `wrangler.portal.jsonc`
- **Routes:** `portal.tequit.co.za/*`
- **Bindings:** D1 (`kharon-portal`), R2 (`kharon-portal-storage`)
- **Cron:** `0 * * * *` (hourly data retention enforcement)
- **Root redirect:** `portal.tequit.co.za/` → `/portal/login` (302, handled in setup middleware)

## Deploy Commands

```bash
npm run deploy:website    # Deploy website worker only
npm run deploy:portal     # Deploy portal worker only
npm run deploy:cloudflare # Deploy both (website then portal)
```

## Build

Both projects share the same Astro build output. Run `npm run build` before deploying either project.

## D1 Migrations

Migrations are scoped to the portal config:

```bash
npx wrangler d1 migrations apply DB --remote --config wrangler.portal.jsonc
```

## Domain Cutover

At production cutover from `tequit.co.za` to `kharon.co.za`, update only:
- `PUBLIC_SITE_URL`
- `PUBLIC_PORTAL_URL`
- `PUBLIC_CONTACT_EMAIL`
- Route patterns in `wrangler.website.jsonc` and `wrangler.portal.jsonc`

No code changes are required.
