# Kharon Cloudflare Deployment

## Overview

The repository deploys as a hybrid Astro SSR application with separate generated artifacts:

- the public site uploads to Cloudflare Pages from `.deploy/website`
- the portal deploys as a Cloudflare Worker from `.deploy/portal/server/wrangler.json`

D1 backs portal data, and R2 stores portal documents.

## Active Topology

- Runtime: Astro `output: "server"` with `@astrojs/cloudflare`
- Public site Pages project: `kfs-website`
- Portal base config: `wrangler.portal.jsonc`
- Generated portal Worker config: `.deploy/portal/server/wrangler.json`
- Production domains: `www.tequit.co.za`, `tequit.co.za`, `portal.tequit.co.za`

`BUILD_TARGET=portal` uses `wrangler.portal.jsonc` and produces the portal Worker artifact with D1, R2, secrets, and cron. `BUILD_TARGET=website` uses `wrangler.website.jsonc` and produces the website Pages artifact without D1/R2 bindings. The website artifact redirects `/portal/**` and binding-backed public API posts to `https://portal.tequit.co.za` before portal code touches bindings.

## Commands

### Authentication

```bash
npm run auth:cloudflare
npm run cloudflare:whoami
```

### Build

```bash
npm run build
npm run build:portal
npm run build:website
npm run build:production
```

`build:production` builds both targets and writes `.deploy/portal` plus `.deploy/website`.

### Deploy

```bash
npm run deploy:cloudflare

npm run deploy:cloudflare:ps
```

`deploy:cloudflare` runs the repo's split artifact path:

- `npm run build:production`
- portal deploy from `.deploy/portal/server/wrangler.json`
- Pages deploy from `.deploy/website`

`deploy:cloudflare:ps` uses the PowerShell helper for the same production-only path.

## GitHub Actions

`.github/workflows/ci-cd.yml` is the intended unattended deploy gate. It currently performs:

- `npm ci`
- `npm run lint`
- `npm run check`
- `npm run build:production`
- `npm run audit:site`
- `npm audit --omit=dev`
- remote D1 preflight and schema smoke checks on push to `main`
- D1 backup and migrations on push to `main`
- `wrangler deploy --config .deploy/portal/server/wrangler.json` for the portal on push to `main`
- `wrangler pages deploy .deploy/website --project-name kfs-website --branch main` for the public site on push to `main`

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Deployment Configuration

### Public Site Pages Project

- Project name: `kfs-website`
- Deploy command: `wrangler pages deploy .deploy/website --project-name kfs-website --branch main`
- Build helper: `scripts/build-deploy-artifacts.ps1 website`
- Purpose: public site routing for `www.tequit.co.za` and `tequit.co.za`
- Bindings: none

### `wrangler.portal.jsonc`

- Portal Worker name: `kfs-portal`
- Route:
  - `portal.tequit.co.za/*`
- D1 binding: `DB`
- R2 binding: `STORAGE`
- Cron: `0 * * * *`

## Operational Notes

- Direct local deployment remains blocked until Wrangler auth is valid.
- The generated `.deploy/portal/server/wrangler.json` should exist after build and include both `DB` and `STORAGE`.
- The generated `.deploy/website` Pages artifact must not include D1/R2 bindings.
- Dry-run portal deploys should use `.deploy/portal/server/wrangler.json`; direct root configs are base configs, not deploy artifacts.
- Domain-level apex-to-www redirects should stay in Cloudflare zone rules, not `_redirects`.
- Canonical URLs, metadata and portal links are production-only and should resolve to the Tequit domains above.
- `kharon.co.za` remains a future cutover domain only. Do not configure DNS, routes, or deploys for it before explicit completion approval.
