# Zone C — API Endpoints & Repository Layer: Correctness & Security Audit

**Date:** 2026-06-06
**Scope:** `src/pages/portal/api/` (all except `/finance/`), `src/lib/server/db/`, `src/lib/server/repositories/`, `src/lib/server/services/` (except finance-service and sage-client), `src/lib/server/access.ts`, `http-errors.ts`, `http.ts`, `request.ts`, `packages/types/src/domain.ts`, `packages/types/src/base.ts`

---

## Table Schema Verification

Before applying soft-delete fixes, migrations were audited to determine which tables actually carry a `deleted_at` column. This is a prerequisite — applying `deleted_at IS NULL` to a column that does not exist causes a SQLite runtime error.

**Tables WITH `deleted_at`:** `jobs` (0022), `defects` (0022), `certificates` (0022/0023), `systems` (0023), `sites` (0028), `users` (0033), `staff_members` (0035a), `staff_files` (0035a), `clients` (0027), `staff_leave_requests` (0035b), `staff_documents` (0035b)

**Tables WITHOUT `deleted_at` (intentional — not soft-delete targets):** `maintenance_requests`, `financial_records`, `contact_submissions`, `user_feedback`, `audit_events`, `rate_limits`, `password_reset_tokens`, `job_visits`, `job_evidence_files`

Queries against `financial_records` and `maintenance_requests` without `deleted_at IS NULL` are **correct** — those tables have no such column. Initial audit assumptions that flagged them as violations were incorrect after migration verification.

---

## Fixes Applied

### Rule 1 — Soft-Delete Filter Gaps

**`src/pages/portal/api/admin/users.ts`** — 4 UPDATE statements lacked `AND deleted_at IS NULL`, allowing mutation of soft-deleted user records.

- `deactivate` action: `UPDATE users SET is_active = 0 WHERE id = ?1` → added `AND deleted_at IS NULL`
- `reset-mfa` action: `UPDATE users SET mfa_enabled = 0 ... WHERE id = ?1` → added `AND deleted_at IS NULL`
- `update` action (full profile update): `UPDATE users SET name = ?1 ... WHERE id = ?7` → added `AND deleted_at IS NULL`
- `update` action (password reset sub-query): `UPDATE users SET password_hash = ?1 ... WHERE id = ?2` → added `AND deleted_at IS NULL`

**`src/pages/portal/api/admin/sites.ts`** — UPDATE lacked `AND deleted_at IS NULL`, allowing mutation of soft-deleted site records.

- `update` action: `UPDATE sites SET ... WHERE id = ?7` → added `AND deleted_at IS NULL`

### Rule 1 + Users `is_active` — Report Service Active User Count

**`src/lib/server/services/report-service.ts`** — The `active_users` scalar subquery counted all non-deleted users without filtering inactive accounts, overstating the portal's active user count.

- `(SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)` → added `AND is_active = 1`

### Rule 2 — Missing Input Sanitization

**`src/pages/portal/api/feedback.ts`** — `category` and `message` were read directly from the request body and passed to the D1 INSERT without sanitization. An authenticated user could insert arbitrary strings of any length into `user_feedback`.

- Added `import { cleanChoice, cleanText } from "../../../lib/server/access"`
- `category` now validated via `cleanChoice` against the four values the UI actually sends: `["ui", "performance", "bug", "suggestion"]`
- `message` now bounded via `cleanText(..., { min: 1, max: 2000 })`
- `page_path` now sanitized via `cleanText(..., { required: false, max: 500 })`

### Rule 3 — Access Guard Pattern

**`src/pages/portal/api/admin/dispatch.ts`** — Used a hand-rolled inline check (`if (!locals.user || locals.user.role !== "admin") return unauthorized(...)`) instead of `requireAdmin`. This returned HTTP 401 Unauthorized for an authenticated-but-wrong-role request; the correct status is 403 Forbidden, which `requireAdmin` returns.

- Replaced inline check with `const adminError = requireAdmin(locals.user); if (adminError) return adminError;`
- Removed unused `unauthorized` import
- Added `requireAdmin` import from `../../../../lib/server/access.js`

### Rule 5 — Inline Type Duplication

**`src/pages/portal/api/admin/defects.ts`** — Imported `DefectSeverity` and `DefectStatus` from a relative path (`../../../../types`) instead of `@sentinel/types`. This bypasses the canonical package boundary and breaks if the types package structure changes.

- Changed to `import type { DefectSeverity, DefectStatus } from "@sentinel/types"`

**`src/lib/server/db/staff-repository.ts`** — Defined `DbStaffMember` and `DbStaffFile` inline, duplicating canonical definitions already present in `packages/types/src/domain.ts`. Also missing the required `D1Database` import (used in all function signatures but not imported).

- Removed both inline interface definitions
- Added `import type { D1Database } from "@cloudflare/workers-types"`
- Added `import type { DbStaffMember, DbStaffFile } from "@sentinel/types"`
- Added `export type { DbStaffMember, DbStaffFile }` re-export for existing consumers

### Additional Bug — Shadowed Variable

**`src/pages/portal/api/job-status.ts`** — A redundant `const db = getDatabase()` inside the main try block shadowed the outer `let db` that was already assigned from the initial `getDatabase()` call. The outer `db` was used by the catch block's `auditError` call; the inner `const db` was used for all queries. This caused no runtime failure (both referenced the same binding), but the pattern was confusing and made the catch-block db reference appear potentially undefined.

- Removed the redundant inner `const db = getDatabase()` declaration; all code now uses the single outer `db`

---

## Verified Non-Violations (Initially Flagged, Cleared After Schema Check)

| Location | Initial Concern | Verdict |
|---|---|---|
| `admin/maintenance-requests.ts` SELECT | Missing `deleted_at IS NULL` | Cleared — `maintenance_requests` has no `deleted_at` column |
| `approve-quote.ts` `financial_records` SELECT | Missing `deleted_at IS NULL` | Cleared — `financial_records` has no `deleted_at` column |
| `report-service.ts` `financial_records` queries | Missing `deleted_at IS NULL` | Cleared — same as above |

---

## Systemic Deviations (Documented, Not Fixed)

### Rule 6 — `withErrorHandling` Wrapper Absent

No endpoint in the zone uses `withErrorHandling()` from `http-errors.ts`. All handlers use explicit `try/catch` with `auditError` + `serverError`, which achieves the same security outcome (no internal detail leakage, audit trail preserved). Refactoring ~25 endpoints to use `withErrorHandling` would be a large structural change with regression risk and no security uplift given the existing patterns. Documented here for future consideration.

### Rule 7 — Direct `db.prepare()` Outside Repositories

The majority of endpoints call `db.prepare()` directly rather than routing through repository methods. This is the established codebase pattern for endpoint-level queries. All such calls in this zone are parameterized and correctly filtered. No security risk exists from the pattern itself. Converting all endpoints to go through repositories would be a multi-hundred-line refactor outside the scope of a correctness/security pass.

**Exception confirmed acceptable:** The services layer (`dashboard-service.ts`, `compliance-service.ts`, `report-service.ts`, `audit-service.ts`) legitimately uses `db.prepare()` directly for aggregate queries — this is the documented services layer pattern.

### `staff/[action].ts` — String Coercion Instead of `clean*`

Input fields use `String(body.x ?? "").trim()` instead of `cleanText`/`cleanEmail`. All values are bounded by `VALID_EMPLOYMENT_TYPES` and `VALID_STATUSES` set membership checks before use. The direct string coercion is not a security gap (no unvalidated values reach D1) but diverges from the project's preferred validation idiom. Recommended for a follow-up style pass.

---

## Files Modified

| File | Rule | Change |
|---|---|---|
| `src/pages/portal/api/admin/users.ts` | Rule 1 | 4 UPDATE statements — added `AND deleted_at IS NULL` |
| `src/pages/portal/api/admin/sites.ts` | Rule 1 | UPDATE statement — added `AND deleted_at IS NULL` |
| `src/lib/server/services/report-service.ts` | Rule 1 + is_active | `active_users` count — added `AND is_active = 1` |
| `src/pages/portal/api/feedback.ts` | Rule 2 | Sanitize `category`, `message`, `page_path` via `clean*` |
| `src/pages/portal/api/admin/dispatch.ts` | Rule 3 | Replace inline role check with `requireAdmin` |
| `src/pages/portal/api/admin/defects.ts` | Rule 5 | Fix import path to `@sentinel/types` |
| `src/lib/server/db/staff-repository.ts` | Rule 5 | Remove inline types; import from `@sentinel/types`; add `D1Database` import |
| `src/pages/portal/api/job-status.ts` | Bug | Remove shadowed inner `db` variable |

**TypeScript:** `tsc --noEmit` passes with zero errors after all changes.
