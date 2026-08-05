# AGENTS.md - Kharon Website

## Critical Setup
- **Runtime**: Node `>=22.12.0` (pinned by `.node-version`, currently 22.22.1); CI installs from that file.
- **Environment**: `.dev.vars` requires `SESSION_SECRET`, `ENCRYPTION_SECRET`, `MFA_SECRET`, and `ENVIRONMENT=local`. Missing `MFA_SECRET` breaks portal auth silently.
- **Database**: Run `npx wrangler d1 migrations apply kharon-portal --local` before first login. Seed users ship with an undocumented hash — set a known local password via `npm run portal:hash-password "<pw>"` (>=12 chars) then `UPDATE users SET password_hash='<hash>'` (see CLAUDE.md).
- **Migration preflight**: On `main` pushes, CI runs `npx tsx scripts/d1-migration-preflight.ts DB` (ledger + duplicate-prefix check) and `npx tsx scripts/d1-schema-smoke.ts DB` (pre) / `... DB --post` against remote D1, around `wrangler d1 migrations apply DB --remote`.

## Toolchain & Commands
- **Build**: `npm run build` (Critical: `src/sw.ts` $\to$ `public/sw.js` must happen before Astro build).
- **Lint/Typecheck**: `npm run lint` (ESLint) and `npm run check` (`astro check`). Both run in CI.
- **Validation**: Run `npm run validate:site` before PRs. Husky enforces `npm run lint` on pre-commit and `npm run validate:site` on pre-push.
- **Tests**: `npx playwright test` (e2e) or `npx playwright test tests/foo.spec.ts` (single file). Integration suite in `tests/integration/` (auth/session/rbac) needs seeded users first: `npx wrangler d1 execute kharon-portal --local --file=tests/fixtures/seed-test-users.sql`.

## Architecture Constraints
- **Bindings**: Use `getDatabase()` / `getStorage()` from `@server/bindings`. Do NOT use `Astro.locals.env` or `context.env`.
- **DB Access**: All queries must go through `src/lib/server/db/*.ts` repositories. Filter by `deleted_at IS NULL`.
- **Types**: Import D1 entities from `packages/types/src/domain.ts`. No inline DB types.
- **Financials**: Store as `INTEGER` cents. VAT is 15% (`Math.round((amountCents * 15) / 100)`). No floating point.

## Security Invariants
- **CSP**: All inline `<script>` must have `nonce={Astro.locals.nonce}`.
- **CSRF**: Every mutating portal `<form>` must include `<CsrfInput />`.
- **DOM**: `innerHTML`, `outerHTML`, and `insertAdjacentHTML` are banned. Use `textContent` or `replaceChildren`.
- **Privacy**: Store IP addresses as SHA-256 hashes only.
- **Tokens**: Use constant-time equality for session tokens.

## Project Guardrails
- **Budgets**: Global CSS < 120KB hard limit (115KB warning). Client JS assets < 20KB.
- **Audit**: `npm run audit:site` checks for banned terms defined in `scripts/audit-site.ts`.
- **UI**: No emojis. Use SVG icons. Minimum touch target 44x44px.
- **Reference**: See `CLAUDE.md` for full command list and `DESIGN_CONSTITUTION.md` for UI specs.
