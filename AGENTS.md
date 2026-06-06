# AGENTS.md - Kharon Website

## Critical Setup
- **Environment**: `.dev.vars` requires `SESSION_SECRET`, `ENCRYPTION_SECRET`, `MFA_SECRET`, and `ENVIRONMENT=local`. Missing `MFA_SECRET` breaks portal auth silently.
- **Database**: Run `npx wrangler d1 migrations apply kharon-portal --local` before first login.

## Toolchain & Commands
- **Build**: `npm run build` (Critical: `src/sw.ts` $\to$ `public/sw.js` must happen before Astro build).
- **Validation**: Run `npm run validate:site` before PRs.
- **Tests**: `npx playwright test` (e2e) or `npx playwright test tests/foo.spec.ts` (single file).

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
