# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Current-stack reference:** `docs/STACK_REFERENCE.md` holds the version-pinned official-docs
> index plus **canonical patterns verified against live docs (Astro 6 / `@astrojs/cloudflare` v13,
> Tailwind v4, Zod v4, Wrangler 4)** and the curated skill/MCP map for this stack. Read it before
> any version-sensitive change â€” APIs on this stack drift fast.

---

## Commands

```bash
npm run dev                   # Start dev server (binds D1/R2 from .dev.vars)
npm run build                 # Full build: SW compile â†’ Astro â†’ CSS purge
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
```

**Local environment** â€” create `.dev.vars` at the root (all four secrets required):
```
SESSION_SECRET=<32+ char secret>
ENCRYPTION_SECRET=<32+ char secret>
MFA_SECRET=<32+ char secret, different from SESSION_SECRET>
ENVIRONMENT=local
```
Missing `MFA_SECRET` silently breaks portal login â€” auth crashes at session token creation.

---

## Architecture

### Build pipeline (critical ordering)

The service worker (`src/sw.ts`) must be compiled to `public/sw.js` **before** the Astro build runs. This is wired up in the `build` script. Never move SW compilation into `astro.config.ts` Vite settings â€” doing so overrides Astro's main page compilation and breaks server route generation.

### Runtime environment

Deployed as a Cloudflare Pages + Workers project (SSR via `@astrojs/cloudflare`). All Cloudflare bindings (D1, R2, secrets) are accessed via the `cloudflare:workers` module in `src/lib/server/bindings.ts`:

```ts
import { getDatabase, getStorage, getBindings } from "@server/bindings";
```

`Astro.locals.env` and `context.env` patterns do **not** work here â€” use `getDatabase()` / `getStorage()` exclusively.

### Middleware chain (`src/middleware.ts`)

Six sequential handlers applied to every `/portal` request:

1. **setup** â€” generates CSP nonce (`context.locals.nonce`) and A/B UI variant
2. **auth** â€” verifies session cookie, checks revocation, loads live user from D1
3. **mfaEnforcement** â€” blocks API calls if `mfa_required && !mfa_enabled`
4. **csrfAndRateLimit** â€” CSRF token validation + per-endpoint rate limits on mutating requests
5. **rbac** â€” enforces role path rules, handles `forcePasswordChange` and MFA setup redirects
6. **security** â€” injects security headers + rewrites nonces into `<script>`/`<style>` tags

Role â†’ dashboard mappings: `admin â†’ /portal/admin/dashboard`, `tech â†’ /portal/tech/dashboard`, `client â†’ /portal/client/dashboard`, `finance â†’ /portal/finance/dashboard`.

> **Astro 6 + `@astrojs/cloudflare` v13 removal**: `Astro.locals.runtime` is gone. For the `ExecutionContext` (`waitUntil()`) use `Astro.locals.cfContext`. Any remaining `locals.runtime` usage is a runtime crash.

### Type system

- **DB entity types** live in `packages/types/src/domain.ts` â€” `DbUser`, `DbSite`, `DbSystem`, `DbJob`, `DbDefect`, `DbCertificate`, `DbFinancialRecord`, `DbLinkableJob`, and others. Import from there, never define inline types for database rows.
- **Zod validation schemas** live in `packages/types/src/base.ts` â€” `JobSchema`, `JobCreateSchema`, `JobUpdateSchema`, etc. Use these at API boundaries.
- **Zod v4 breaking change**: `safeParse()` errors are in `error.issues[]` (not `error.errors`). Each issue has `{ code, path, message }`. Switch any remaining `error.errors` reads to `error.issues`.

### Repository layer (`src/lib/server/db/`)

All database access goes through:
- `user-repository.ts`, `job-repository.ts`, `system-repository.ts`, `defect-repository.ts`, `finance-repository.ts`, `staff-repository.ts`

There is a secondary `src/lib/server/repositories/` directory containing newer `job-repository.ts` and `site-repository.ts` â€” these follow the same conventions. Direct `db.prepare()` calls are prohibited outside repositories. Every read must filter `deleted_at IS NULL` â€” the soft-delete pattern applies to all tables (`users` additionally uses `is_active`).

### Services layer (`src/lib/server/services/`)

Higher-level business logic that orchestrates repository calls:
- `finance-service.ts` â€” finance task lifecycle (quote â†’ invoice â†’ payment), Sage-first model
- `job-service.ts` â€” job dispatch and status transitions
- `compliance-service.ts`, `dashboard-service.ts`, `report-service.ts`, `audit-service.ts`
- `sage-client.ts` â€” Sage OAuth2 client for accounting sync

### Access control and input validation (`src/lib/server/access.ts`)

All API endpoints use these helpers at the top of handlers:

```ts
import { requireAdmin, requireFinance, clientSiteIds, cleanText, cleanId, cleanEmail, cleanInt } from "@server/access";

const guard = requireAdmin(user);      // returns Response | null
if (guard) return guard;               // 403 if not admin
```

Input sanitisers (`cleanText`, `cleanId`, `cleanEmail`, `cleanDate`, `cleanChoice`, `cleanBoolean`, `cleanInt`) are the boundary validators â€” use them on all user-supplied values before writing to D1.

### Error handling (`src/lib/server/http-errors.ts`)

Use `withErrorHandling()` to wrap API handlers:

```ts
import { withErrorHandling, badRequest, forbidden } from "@server/http-errors";

return withErrorHandling(db, request, async () => {
  // handler body â€” throw AppError subclasses for structured responses
  if (!valid) throw badRequest("Invalid field", { field: "name" });
}, { entityType: "job", entityId: id, user });
```

Never leak internal error details â€” `AppError.toJSON()` sanitises stack traces, file paths, and connection strings before returning to the client.

### Client-side portal pattern (`src/lib/client/portalApi.ts`)

All `<script>` blocks in portal pages import from this module â€” not typed `is:inline`. Provides:
- `portalPost(url, payload)` â€” POST with automatic CSRF injection
- `extractFormPayload(form)` â€” serialises form fields (checkboxes as "1"/"0")
- `setResult(el, text, variant)` â€” renders success/error/warning into result elements
- `bindAdminForms()` â€” wires up all `.admin-form` elements on the page

### Portal admin panels (`src/components/portal/admin/`)

`operations.astro` imports 7 extracted single-responsibility components: `EnquiriesPanel`, `JobsPanel`, `UsersPanel`, `SiteSystemsPanel`, `DataPanel`, `DefectsPanel`, `CertificatesPanel`. Do not collapse them back into the page file.

### Offline / PWA (`src/lib/offline/`)

- `draft-storage.ts` â€” IndexedDB draft persistence with quota management and JPEG/WebP compression
- `sync-queue.ts` â€” background sync with priority-based exponential backoff (High: 10 retries, Normal: 5, Low: 3)

The service worker at `src/sw.ts` uses network-first for API routes, cache-first for static assets.

### Financial data

All monetary values are stored as **INTEGER cents** â€” never `REAL`. VAT is always 15%, calculated as `Math.round((amountCents * 15) / 100)`. Floating-point arithmetic on money is prohibited.

The portal follows a **Sage-first model**: official invoices and payments live in Sage Accounting; the portal tracks operational finance tasks (`FinanceTask`) that mirror the Sage document lifecycle (`Quote Required â†’ Quote Issued in Sage â†’ Invoice Required â†’ Invoice Issued in Sage â†’ Payment Recorded in Sage`). Never duplicate accounting records in D1.

### Scheduling algorithms (`src/lib/algorithms/`)

- `capacity-balancing.ts` â€” technician workload balancing
- `sla-algorithm.ts` â€” SLA scoring and prioritisation for job dispatch

---

## Security invariants (non-negotiable)

**CSP nonce** â€” every inline `<script>` in layouts and components must use the nonce from `Astro.locals.nonce`:
```astro
<script nonce={Astro.locals.nonce}>â€¦</script>
```
The middleware rewrites `<script>` tags that lack a nonce attribute as a fallback, but always set it explicitly.

**CSRF** â€” every portal `<form>` that mutates state must contain `<CsrfInput />` (from `src/components/portal/`).

**innerHTML ban** â€” never assign to `innerHTML`/`outerHTML`, never call `insertAdjacentHTML()`. Use `element.textContent`, `element.replaceChildren()`, or `document.createRange().createContextualFragment()`.

**Session tokens** â€” all comparisons must use constant-time equality. Never use `===` to compare tokens.

**IP storage** â€” store only SHA-256 hashes of IP addresses, never raw IPs (POPIA Â§14).

---

## Audit script rules

`npm run audit:site` will fail if banned placeholder terms, old 3D-scene names, fake telemetry labels, consumer-security positioning, or obvious demo credential examples appear in pages or comments.

Keep the exact banned-term list in `scripts/audit-site.ts` as the source of truth so this guidance does not reintroduce audit-triggering strings.

---

## Size budgets

- Global CSS: **< 120KB** hard limit, **115KB** warning threshold (enforced by `scripts/audit-site.ts`; purged by `scripts/purge-css.ts` post-build). Budget raised from 100KB on 2026-06-01 because the previous limit was only achievable via a structurally-corrupt purge script; with correct Tailwind v4 nested-layer output the `@layer utilities` alone is ~92.5KB from 103 source files.
- Public client JS assets: **< 20KB** per asset

---

## Path aliases (tsconfig)

```
@/*          â†’ src/*
@components/* â†’ src/components/*
@lib/*        â†’ src/lib/*
@utils/*      â†’ src/lib/utils/*
@server/*     â†’ src/lib/server/*
```

---

## Domain & deployment context

The production domains are `kharon.co.za`, `www.kharon.co.za`, and `portal.kharon.co.za`. Active build defaults and CI use production URLs only.

D1 database: `kharon-portal` (binding `DB`). R2 bucket: `kharon-portal-storage` (binding `STORAGE`). Cron trigger fires hourly (`0 * * * *`) for data retention enforcement.

### Wrangler configs (split deployment)

- `wrangler.portal.jsonc` â€” portal worker (`kfs-portal`), routes `portal.kharon.co.za/*`, holds D1 + R2 bindings
- `wrangler.website.jsonc` â€” website worker (`kfs-website`), routes `kharon.co.za/*` and `www.kharon.co.za/*`, no bindings

`astro.config.ts` passes `configPath: "wrangler.portal.jsonc"` to the cloudflare adapter so the generated `dist/server/wrangler.json` includes the D1/R2 bindings required by the audit script. Do not remove this. Full architecture documented in `docs/roadmap/DEPLOYMENT_ARCHITECTURE.md`.

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

Minimum interactive touch target: **44Ã—44px**. No emojis in UI â€” SVG icons only. No pastel colours or generic SaaS admin aesthetics.

