# Deployment Architecture

## Two-Project Structure

The Kharon codebase deploys from a single Astro build to two separate Cloudflare Workers projects.

### kfs-website

- **Config:** `wrangler.website.jsonc`
- **Routes:** `kharon.co.za/*`, `www.kharon.co.za/*`
- **Bindings:** None (public marketing site â€” no D1 or R2 required)
- **Cron:** None

### kfs-portal

- **Config:** `wrangler.portal.jsonc`
- **Routes:** `portal.kharon.co.za/*`
- **Bindings:** D1 (`kharon-portal`), R2 (`kharon-portal-storage`)
- **Cron:** `0 * * * *` (hourly data retention enforcement)
- **Root redirect:** `portal.kharon.co.za/` -> `/portal/login` (302, handled in setup middleware)

## Deploy Commands

```bash
npm run deploy:website    # Deploy website worker only
npm run deploy:portal     # Deploy portal worker only
npm run deploy:cloudflare # Deploy both (website then portal)
```

## Build

Both projects share the same Astro build output. Run `npm run build` before deploying either project.

The `@astrojs/cloudflare` adapter is configured with `configPath: "wrangler.portal.jsonc"` in `astro.config.ts` so the generated `dist/server/wrangler.json` includes the D1 and R2 bindings. Without this, the audit step fails with "Generated wrangler config missing binding DB/STORAGE".

## D1 Migrations

Migrations are scoped to the portal config:

```bash
npx wrangler d1 migrations apply DB --remote --config wrangler.portal.jsonc
```

## Production Domains

The production domain set is fixed in build defaults and Wrangler route patterns:

- `PUBLIC_SITE_URL=https://www.kharon.co.za`
- `PUBLIC_PORTAL_URL=https://portal.kharon.co.za`
- `PUBLIC_CONTACT_EMAIL=admin@kharon.co.za`

