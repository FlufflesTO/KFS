# Deployment Architecture

## Two-Project Structure

The Kharon codebase deploys from one repo to two separate Cloudflare targets with separate build artifacts.

### kfs-website

- **Config:** `wrangler.website.jsonc`
- **Routes:** `tequit.co.za/*`, `www.tequit.co.za/*`
- **Artifact:** `.deploy/website`
- **Bindings:** None (public marketing site - no D1 or R2 required)
- **Cron:** None

### kfs-portal

- **Config:** `wrangler.portal.jsonc`
- **Routes:** `portal.tequit.co.za/*`
- **Artifact:** `.deploy/portal/server/wrangler.json`
- **Bindings:** D1 (`kharon-portal`), R2 (`kharon-portal-storage`)
- **Cron:** `0 * * * *` (hourly data retention enforcement)
- **Root redirect:** `portal.tequit.co.za/` -> `/portal/login` (302, handled in setup middleware)

## Deploy Commands

```bash
npm run deploy:website    # Build and deploy website Pages artifact only
npm run deploy:portal     # Build and deploy portal Worker artifact only
npm run deploy:cloudflare # Deploy both (website then portal)
```

## Build

Use target-specific builds before deploying either project:

```bash
npm run build:portal      # BUILD_TARGET=portal, writes .deploy/portal
npm run build:website     # BUILD_TARGET=website, writes .deploy/website
npm run build:production  # Builds both artifacts
```

`astro.config.ts` selects `wrangler.portal.jsonc` when `BUILD_TARGET=portal` and `wrangler.website.jsonc` when `BUILD_TARGET=website`. The website artifact must not include portal D1/R2 bindings.

## D1 Migrations

Migrations are scoped to the portal config:

```bash
npx wrangler d1 migrations apply DB --remote --config wrangler.portal.jsonc
```

## Production Domains

The production domain set is fixed in build defaults and Wrangler route patterns:

- `PUBLIC_SITE_URL=https://www.tequit.co.za`
- `PUBLIC_PORTAL_URL=https://portal.tequit.co.za`
- `PUBLIC_CONTACT_EMAIL=admin@tequit.co.za`

`kharon.co.za` is a future cutover domain only and remains gated until explicit approval.

