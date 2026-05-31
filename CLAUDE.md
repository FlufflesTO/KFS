# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev                   # Start dev server (binds D1/R2 from .dev.vars)
npm run build                 # Full build: SW compile → Astro → CSS purge
npm run lint                  # ESLint
npm run validate:site         # Build + security/compliance audit (run before PRs)
npx playwright test           # E2E tests
npx playwright test tests/foo.spec.ts  # Single test file

# D1 database
npx wrangler d1 migrations apply kharon-portal --local   # Local migrations (MUST run before first login)
npx wrangler d1 execute kharon-portal --local < seed-users.sql  # Seed test users
# Seed users ship with an undocumented hash (plaintext removed from git for security).
# To set a known local password, generate a new hash and UPDATE directly:
#   node --input-type=module --eval "$(cat scripts/hash-password.ts | sed 's/process.argv\[2\]/\"YourLocalPassword\"/g')"
# Then: wrangler d1 execute kharon-portal --local --command "UPDATE users SET password_hash='<hash>'"
npx wrangler d1 migrations apply kharon-portal --remote  # Remote (production)

# Deployment
npm run deploy:cloudflare           # Production deploy
npm run deploy:cloudflare:preview   # Preview deploy
```

**Local environment** — create `.dev.vars` at the root (all four secrets required):
```
SESSION_SECRET=<32+ char secret>
ENCRYPTION_SECRET=<32+ char secret>
MFA_SECRET=<32+ char secret, different from SESSION_SECRET>
ENVIRONMENT=local
```
Missing `MFA_SECRET` silently breaks portal login — auth crashes at session token creation.

---

## Architecture

### Build pipeline (critical ordering)

The service worker (`src/sw.ts`) must be compiled to `public/sw.js` **before** the Astro build runs. This is wired up in the `build` script. Never move SW compilation into `astro.config.ts` Vite settings — doing so overrides Astro's main page compilation and breaks server route generation.

### Runtime environment

Deployed as a Cloudflare Pages + Workers project (SSR via `@astrojs/cloudflare`). All Cloudflare bindings (D1, R2, secrets) are accessed via the `cloudflare:workers` module in `src/lib/server/bindings.ts`:

```ts
import { getDatabase, getStorage, getBindings } from "@server/bindings";
```

`Astro.locals.env` and `context.env` patterns do **not** work here — use `getDatabase()` / `getStorage()` exclusively.

### Middleware chain (`src/middleware.ts`)

Five sequential handlers applied to every `/portal` request:

1. **setup** — generates CSP nonce (`context.locals.nonce`) and A/B UI variant
2. **auth** — verifies session cookie, checks revocation, loads live user from D1
3. **mfaEnforcement** — blocks API calls if `mfa_required && !mfa_enabled`
4. **csrfAndRateLimit** — CSRF token validation + per-endpoint rate limits on mutating requests
5. **rbac** — enforces role path rules, handles `forcePasswordChange` and MFA setup redirects
6. **security** — injects security headers + rewrites nonces into `<script>`/`<style>` tags

Role → dashboard mappings: `admin → /portal/admin/dashboard`, `tech → /portal/tech/dashboard`, `client → /portal/client/dashboard`, `finance → /portal/finance/dashboard`.

### Type system

All D1 entity types live in `packages/types/src/domain.ts` — `DbUser`, `DbSite`, `DbSystem`, `DbJob`, `DbDefect`, `DbCertificate`, `DbFinancialRecord`, `DbLinkableJob`, and others. Import from there, never define inline types for database rows.

### Repository layer (`src/lib/server/db/`)

All database access goes through:
- `user-repository.ts`, `job-repository.ts`, `system-repository.ts`, `defect-repository.ts`, `finance-repository.ts`

Direct `db.prepare()` calls are prohibited outside repositories. Every read must filter `deleted_at IS NULL` — the soft-delete pattern applies to all tables (`users` additionally uses `is_active`).

### Client-side portal pattern (`src/lib/client/portalApi.ts`)

All `<script>` blocks in portal pages import from this module — not typed `is:inline`. Provides:
- `portalPost(url, payload)` — POST with automatic CSRF injection
- `extractFormPayload(form)` — serialises form fields (checkboxes as "1"/"0")
- `setResult(el, text, variant)` — renders success/error/warning into result elements
- `bindAdminForms()` — wires up all `.admin-form` elements on the page

### Portal admin panels (`src/components/portal/admin/`)

`operations.astro` imports 7 extracted single-responsibility components: `EnquiriesPanel`, `JobsPanel`, `UsersPanel`, `SiteSystemsPanel`, `DataPanel`, `DefectsPanel`, `CertificatesPanel`. Do not collapse them back into the page file.

### Offline / PWA (`src/lib/offline/`)

- `draft-storage.ts` — IndexedDB draft persistence with quota management and JPEG/WebP compression
- `sync-queue.ts` — background sync with priority-based exponential backoff (High: 10 retries, Normal: 5, Low: 3)

The service worker at `src/sw.ts` uses network-first for API routes, cache-first for static assets.

### Financial data

All monetary values are stored as **INTEGER cents** — never `REAL`. VAT is always 15%, calculated as `Math.round((amountCents * 15) / 100)`. Floating-point arithmetic on money is prohibited.

---

## Security invariants (non-negotiable)

**CSP nonce** — every inline `<script>` in layouts and components must use the nonce from `Astro.locals.nonce`:
```astro
<script nonce={Astro.locals.nonce}>…</script>
```
The middleware rewrites `<script>` tags that lack a nonce attribute as a fallback, but always set it explicitly.

**CSRF** — every portal `<form>` that mutates state must contain `<CsrfInput />` (from `src/components/portal/`).

**innerHTML ban** — never assign to `innerHTML`/`outerHTML`, never call `insertAdjacentHTML()`. Use `element.textContent`, `element.replaceChildren()`, or `document.createRange().createContextualFragment()`.

**Session tokens** — all comparisons must use constant-time equality. Never use `===` to compare tokens.

**IP storage** — store only SHA-256 hashes of IP addresses, never raw IPs (POPIA §14).

---

## Audit script rules

`npm run audit:site` will fail if banned placeholder terms, old 3D-scene names, fake telemetry labels, consumer-security positioning, or obvious demo credential examples appear in pages or comments.

Keep the exact banned-term list in `scripts/audit-site.ts` as the source of truth so this guidance does not reintroduce audit-triggering strings.

---

## Size budgets

- Global CSS: **< 100KB** hard limit, **95KB** warning threshold (enforced by `scripts/audit-site.ts`; purged by `scripts/purge-css.ts` post-build). Budget raised from 95KB on 2026-05-31 for the technical-depth content expansion.
- Public client JS assets: **< 20KB** per asset

---

## Path aliases (tsconfig)

```
@/*          → src/*
@components/* → src/components/*
@lib/*        → src/lib/*
@utils/*      → src/lib/utils/*
@server/*     → src/lib/server/*
```

---

## Domain & deployment context

The staging domain is `tequit.co.za` — this is intentional and not an error. `PUBLIC_SITE_URL`, `PUBLIC_PORTAL_URL`, and `PUBLIC_CONTACT_EMAIL` are the only env vars to change at production cutover to `kharon.co.za`. No code changes are required for the domain switch.

D1 database: `kharon-portal` (binding `DB`). R2 bucket: `kharon-portal-storage` (binding `STORAGE`). Cron trigger fires hourly (`0 * * * *`) for data retention enforcement.

---

## Design system

UI is governed by `DESIGN_CONSTITUTION.md`. Core palette:

| Token | Hex | Role |
|-------|-----|------|
| `--color-kharon-purple` | `#4B2E83` | Primary actions |
| `--color-kharon-blue` | `#1F4E79` | Hover states |
| `--color-kharon-black` | `#0B0D0F` | Backgrounds |
| `--color-kharon-cyan` | `#00C2FF` | Focus rings |
| `--color-kharon-amber` | `#F59E0B` | Warnings only |
| `--color-kharon-red` | `#C4332F` | Errors only |
| `--color-kharon-green` | `#16A34A` | Success only |

Minimum interactive touch target: **44×44px**. No emojis in UI — SVG icons only. No pastel colours or generic SaaS admin aesthetics.
