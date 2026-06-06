# Kharon Cloudflare Deployment

## Overview

The repository deploys as a hybrid Astro SSR application:

- the public site uploads to Cloudflare Pages from a flattened `dist` output
- the portal deploys as a Cloudflare Worker from the generated `dist/server/wrangler.json`

D1 backs portal data, and R2 stores portal documents.

## Active Topology

- Runtime: Astro `output: "server"` with `@astrojs/cloudflare`
- Public site Pages project: `kfs-website`
- Portal base config: `wrangler.portal.jsonc`
- Generated portal Worker config: `dist/server/wrangler.json`
- Production domains: `www.kharon.co.za`, `kharon.co.za`, `portal.kharon.co.za`

The Astro adapter is configured with `configPath: "wrangler.portal.jsonc"`, so the generated `dist/server/wrangler.json` carries the portal bindings needed by the server bundle. `scripts/build-site.ps1` then reshapes the build output into the flat `dist` structure expected by Cloudflare Pages SSR uploads.

## Commands

### Authentication

```bash
npm run auth:cloudflare
npm run cloudflare:whoami
```

### Build

```bash
npm run build
npm run build:production
```

`build:production` produces the flattened production-domain output for the active Cloudflare Pages deployment.

### Deploy

```bash
npm run deploy:cloudflare

npm run deploy:cloudflare:ps
```

`deploy:cloudflare` runs the repo's current hybrid path:

- `npm run build`
- portal deploy from `dist/server/wrangler.json`
- production rebuild via `scripts/build-site.ps1`
- Pages deploy for the public site

`deploy:cloudflare:ps` uses the PowerShell helper for the same production-only path.

## GitHub Actions

`.github/workflows/ci-cd.yml` is the intended unattended deploy gate. It currently performs:

- `npm ci`
- `npm run lint`
- `npm run check`
- `npm run build`
- `npm run audit:site`
- `npm audit --omit=dev`
- remote D1 preflight and schema smoke checks on push to `main`
- D1 backup and migrations on push to `main`
- `wrangler deploy --config dist/server/wrangler.json` for the portal on push to `main`
- `wrangler pages deploy dist --project-name kfs-website --branch main` for the public site on push to `main`

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Deployment Configuration

### Public Site Pages Project

- Project name: `kfs-website`
- Deploy command: `wrangler pages deploy dist --project-name kfs-website --branch main`
- Build helper: `scripts/build-site.ps1`
- Purpose: public site routing for `www.kharon.co.za` and `kharon.co.za`

### `wrangler.portal.jsonc`

- Portal Worker name: `kfs-portal`
- Route:
  - `portal.kharon.co.za/*`
- D1 binding: `DB`
- R2 binding: `STORAGE`
- Cron: `0 * * * *`

## Operational Notes

- Direct local deployment remains blocked until Wrangler auth is valid.
- The generated `dist/server/wrangler.json` should exist after build and include both `DB` and `STORAGE`.
- Dry-run verification showed `wrangler.website.jsonc` and `wrangler.portal.jsonc` are not directly deployable by themselves because they do not define a `main` script or assets directory. Use the generated or flattened outputs above instead.
- Domain-level apex-to-www redirects should stay in Cloudflare zone rules, not `_redirects`.
- Canonical URLs, metadata and portal links are production-only and should resolve to the Kharon domains above.
