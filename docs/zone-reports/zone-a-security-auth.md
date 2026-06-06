# Zone A Security Audit — Authentication & Middleware Layer

**Auditor:** Backend Architect Agent  
**Date:** 2026-06-06  
**Scope:** `src/middleware.ts`, `src/lib/server/auth.ts`, `src/lib/server/session.ts`, `src/lib/server/mfa.ts`, `src/lib/server/csrf.ts`, `src/lib/server/rateLimit.ts`, `src/lib/server/crypto.ts`, `src/lib/server/crypto-utils.ts`, `src/lib/server/bindings-auth.ts`, `src/pages/portal/login.astro`, `src/pages/portal/reset.astro`, `src/pages/portal/api/auth.ts`, `src/pages/portal/api/mfa.ts`, `src/pages/portal/api/logout.ts`, `src/pages/portal/api/change-password.ts`, `src/pages/portal/api/reset-password.ts`

---

## FIXED — Critical: Login endpoint had no rate limiting (CVE class: brute-force / credential stuffing)

**File:** `src/pages/portal/api/auth.ts`  
**Severity:** Critical  
**Status:** Fixed in this audit

### Root cause

`/portal/api/auth` is correctly excluded from the middleware auth guards (the user is not yet authenticated, so `locals.user` is null throughout the chain). However, the `csrfAndRateLimitMiddleware` handler guards its entire rate-limit block behind `if (!user … ) return next()`, which means it exits before reaching the rate-limit logic for this path. The `rateLimitConfig["/portal/api/auth"]` entry in `middleware.ts` was therefore dead configuration.

The `auth.ts` file imported both `consumeRateLimit` and `tooManyRequests` but only called `resetRateLimit` (on the success path). The comment at line 82–83 — "Rate limiting is handled by middleware" — was factually incorrect.

**Consequence:** An attacker could make unlimited POST requests to `/portal/api/auth` with arbitrary email/password combinations with no throttling. The 6-digit TOTP code (1,000,000 possibilities at 30-second windows) was also brute-forceable at this endpoint since MFA verification runs inside the same handler.

### Fix applied

Added two `consumeRateLimit` calls at the top of the POST handler in `auth.ts`, before any user lookup, so they run on every request regardless of authentication state:

1. **Email-scoped bucket** (`portal.auth.login`, 5 attempts / 15 min): blocks repeated attempts against a single account (credential stuffing). Matches the existing success-path `resetRateLimit` scope so the counter clears on successful login.
2. **IP-scoped bucket** (`portal.auth.login.ip`, 10 attempts / 15 min): blocks password-spraying across many accounts from a single IP. Uses SHA-256 of `cf-connecting-ip` as the subject (never stores the raw IP, consistent with POPIA §14 and the existing pattern in `request.ts`).

Both blocks emit an `auth.login / blocked` audit event before returning 429.

---

## FIXED — High: Old session cookie survives password change (session fixation risk)

**File:** `src/pages/portal/api/change-password.ts`  
**Severity:** High  
**Status:** Fixed in this audit

### Root cause

`change-password.ts` updated the password hash in D1 and issued a new session token, but did not revoke the old token. Because tokens are stateless HMAC blobs, a stolen session cookie captured before the password change would remain valid for up to 8 hours (the full `sessionDurationSeconds` window), even after the user rotated their credentials.

`mfa.ts` (the `enable` action, lines 128–132) already demonstrated the correct pattern: extract the old token from the `Cookie` header, call `revokeSessionToken`, then issue the fresh token. `change-password.ts` did not follow this pattern.

### Fix applied

Added old-token extraction and `revokeSessionToken` call immediately before the new `createSessionToken` call, mirroring the existing `mfa.ts` pattern exactly.

**Note:** `reset-password.ts` does not create a new session (it redirects to login), so no session to revoke there. The `mfa.ts` `disable` action re-issues a token but does not revoke the old one — this is lower severity since disabling MFA does not indicate a compromise event; recommend addressing in a follow-up.

---

## CHECKED — Clean: Constant-time comparisons

All token comparison paths use timing-safe equality:

| Path | Function used |
|------|--------------|
| `verifySessionToken` (HMAC signature) | `timingSafeEqual` (XOR accumulator, no early exit on mismatch) |
| `verifyPassword` (PBKDF2 hash) | `constantTimeEqual` (XOR accumulator over max-length) |
| `verifyTotpCode` (TOTP code) | `constantTimeEqual` (same implementation in `mfa.ts`) |
| `verifyCsrfToken` (CSRF signature) | `crypto.subtle.verify` (WebCrypto HMAC verify, timing-safe by spec) |

No `===` comparisons were found on any token, hash, or secret value in any verification path.

---

## CHECKED — Clean: IP storage

All IP addresses are hashed before storage:

- `audit.ts` — `hashIpAddress()` applies SHA-256 with `AUDIT_IP_SALT` before every `INSERT INTO audit_events` and `INSERT INTO document_access_logs`. Raw IP never touches D1.
- `request.ts` — `clientFingerprint()` SHA-256 hashes the IP before including it in the fingerprint composite. Raw IP is used transiently in memory only.
- New fix in `auth.ts` — IP-scoped rate limit uses `sha256Hex(cf-connecting-ip)` as the subject, consistent with the existing pattern.

No raw IP storage found anywhere in the zone.

---

## CHECKED — Clean: Password hashing

Write path in `auth.ts:hashPassword()` uses PBKDF2-SHA256 at 600,000 iterations, meeting the OWASP 2023 recommendation and POPIA §24. The salt is 16 random bytes generated fresh per hash.

The verify path accepts ≥100,000 iterations to accommodate in-flight migration of legacy hashes. This is a deliberate accommodation — no action required. **Recommendation:** add opportunistic rehash-on-login (re-hash with 600k when the stored iteration count is below threshold) so legacy hashes are upgraded passively without requiring a forced reset.

---

## CHECKED — Clean: Astro.locals.runtime usage

Zero occurrences of `Astro.locals.runtime` found across the entire zone. All binding access uses `getDatabase()` / `getStorage()` via `getBindings()` from `@server/bindings`, or the `resolveBindingsForAuth()` path for auth-specific secrets. Consistent with the `@astrojs/cloudflare` v13 pattern.

---

## CHECKED — Clean: Zod error.errors vs error.issues

Zero occurrences of `error.errors` (Zod v3 pattern) found in the zone. The auth and middleware files use manual validation rather than Zod schemas, so this is N/A.

---

## CHECKED — Clean: CSRF protection

`csrfAndRateLimitMiddleware` validates the CSRF token on all state-mutating portal API requests (`POST/PUT/PATCH/DELETE` on `/portal/api/`). The login and reset endpoints are exempted correctly (they are pre-auth paths and use separate rate limiting). The `CsrfInput` component is present in `login.astro` and `reset.astro`. The `verifyCsrfRequest` function reads the token from the `x-csrf-token` header, not from the cookie, satisfying the double-submit pattern.

---

## CHECKED — Clean: MFA enforcement

`mfaEnforcementMiddleware` blocks `/portal/api/` calls with 403 when `mfa_required && !mfa_enabled`. The `rbacMiddleware` redirects non-API paths (pages) to `/portal/account/mfa` under the same condition. Combined, all surfaces are covered.

**Minor gap (non-blocking):** `mfaEnforcementMiddleware` only matches paths starting with `/portal/api/`, not `/portal/admin/api/`. The `rbacMiddleware` catches the page case via 302, but an API call to `/portal/admin/api/*` from an MFA-required user without MFA enabled would not be 403'd by the enforcement middleware — it would fall through to rbac which redirects instead of returning a JSON error. Recommend extending the prefix check to also cover `/portal/admin/api/`.

**Minor gap (non-blocking):** A user with `force_password_change = true` and `mfa_required && !mfa_enabled` is redirected to `/portal/account/password` by `rbacMiddleware`, but `/portal/api/change-password` is in the rbac allowlist — however, `/portal/api/mfa` is also allowed. The order means they can reach change-password first, which is correct. No deadlock.

---

## OUT OF ZONE — Recommendations only

The following issues are outside the audit zone but should be tracked:

1. **`src/lib/server/session.ts` is dead code.** The `validateSession`, `createSession`, `revokeSession`, and `extendSession` functions are not imported by any module in the codebase. The active session system is the stateless HMAC token in `auth.ts`. This file should be removed to avoid future confusion about which session system is authoritative.

2. **`request.ts` fallback secret.** `clientFingerprint` uses the literal string `"default-secret"` if no `FINGERPRINT_SECRET` or `SESSION_SECRET` is configured. In a misconfigured environment this weakens fingerprint isolation. The secret validation in `auth.ts:validateSecretIsolation()` does not cover `FINGERPRINT_SECRET`.

3. **`audit.ts` fallback salt.** `hashIpAddress` uses `"default-audit-salt"` if `AUDIT_IP_SALT` is not set. This is a weak default — collisions between environments (e.g., staging and production) become possible if both use the fallback. Add `AUDIT_IP_SALT` to the startup secret validation.

4. **Opportunistic password rehash on login.** As noted under password hashing, the verify path accepts ≥100k iterations. Add rehash logic in `auth.ts:POST` after a successful `verifyPassword` when `iterations < 600000`, storing the new hash before issuing the session token.

5. **`mfa.ts` disable action does not revoke old session.** Lower severity than the change-password case since disabling MFA is a voluntary downgrade, not a recovery from compromise, but the pattern is inconsistent. Recommend mirroring the `enable` action revoke pattern.
