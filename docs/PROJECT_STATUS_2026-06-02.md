# Project Status - 2026-06-02

## Current Status

The local checkout at `C:\Users\User\Desktop\Astro\kfs` was synced to `origin/main` at `4c29607` before edits, then stabilized on branch `codex/kharon-stabilization-2026-06-02`.

The project remains staging-ready, not production-authoritative. Public pages, portal foundations, staff/HR foundations, dispatch controls, signed session handling, D1/R2-backed workflows, GitHub Actions CI/CD and the Cloudflare Worker build path are implemented in the repository. Production use still depends on operational sign-off, credential rotation, role QA, D1 migration application, HR policy approval, analytics/POPIA approval and Kharon domain cutover approval.

## Verified This Run

| Area | Status | Evidence |
|---|---|---|
| Git baseline | Synced | `git fetch origin`, `git merge --ff-only origin/main`; local `HEAD` and `origin/main` both `4c29607` before stabilization edits |
| Dispatch workflow | Fixed locally | `/portal/api/admin/dispatch.ts` now reads `body.jobId`, supports `assign`, `unassign`, `setDispatch`, validates active technicians and audits once per action |
| Dispatch UI | Fixed locally | `/portal/admin/dispatch` includes assign, reassign, unassign, priority, emergency flag and required-by date controls |
| Login stale-session check | Fixed locally | `/portal/login` now uses `kharon_session_token`, `verifySessionToken` and `isTokenRevoked` from `src/lib/server/auth.ts` |
| Static analysis | Passing | `NODE_OPTIONS=--max-old-space-size=4096`; `npm run lint`, `npm run check` |
| Production build | Passing | `NODE_OPTIONS=--max-old-space-size=4096 npm run build` |
| Site audit | Passing | `npm run audit:site`; CSS output 96,840 bytes, JS output 31,107 bytes |
| Dependency audit | Clean | `npm audit` and `npm audit --omit=dev` both report `0 vulnerabilities` |
| Browser regression tests | Passing | `NODE_OPTIONS=--max-old-space-size=4096 npm run test`; 23 passed, 1 skipped |
| Cloudflare local auth | Authenticated | `npm run cloudflare:whoami` reports the local Wrangler session is authenticated |
| Remote D1 migration ledger | Pending migration found | `npx wrangler d1 migrations list DB --remote --config wrangler.portal.jsonc` shows pending `0035_staff_hr.sql` |
| Portal Worker dry run | Passing | From `dist/server`: `npx wrangler deploy --config wrangler.json --dry-run --outdir ..\..\.wrangler\dry-run-portal` |

## Implementation Notes

- Dispatch API behavior is body-driven. It no longer depends on route params for `jobId`.
- Assignment validates that the selected technician is an active `tech` user and is not deleted.
- `assign` can update dispatch metadata when the UI supplies priority, emergency status or required-by date. Reassign-only forms preserve existing metadata by omitting those fields.
- `unassign` clears only `assigned_technician_id` unless other dispatch fields are explicitly supplied.
- `setDispatch` updates only supplied dispatch metadata and preserves technician assignment.
- Each successful dispatch action writes one audit event: `admin.dispatch.assign`, `admin.dispatch.unassign` or `admin.dispatch.setDispatch`.
- The login page no longer imports the old `src/lib/server/middleware/auth.ts` session-table helper for stale-session detection.

## HR And Staff Reality

Implemented foundation:

- Admin HR route: `src/pages/portal/admin/hr.astro`.
- Staff self-service API foundation: `src/pages/portal/api/staff/[action].ts`.
- Staff vault file APIs: upload, delete and download routes under `src/pages/portal/api/staff/`.
- Migration foundation through `0035_staff_hr.sql`.

Still future work:

- HR approval workflows.
- Leave balance adjustment controls.
- Staff admin review queues beyond the current foundation.
- Production HR policy gates, privacy notices, retention decisions and delegated authority sign-off.
- Applying pending remote migration `0035_staff_hr.sql` to the intended Cloudflare D1 database.

## Analytics Reality

Plausible is technically integrated in `src/layouts/BaseLayout.astro` and only loads on non-portal paths. The current CSP also allows `plausible.io`.

This is not yet a business-complete analytics rollout. POPIA/business sign-off, provider configuration, privacy notice review and production-domain analytics configuration remain approval gates.

## CI/CD Reality

GitHub Actions is the active CI/CD path. No CircleCI configuration was added in this stabilization slice.

## Cloudflare Position

- The local shell is authenticated to Cloudflare.
- Remote D1 has a pending migration: `0035_staff_hr.sql`.
- The generated Astro Worker config under `dist/server/wrangler.json` dry-runs successfully.
- The root split config commands are not deploy-entry commands by themselves because `wrangler.portal.jsonc` and `wrangler.website.jsonc` do not include a root `main` or `assets` entry. Use the generated build config for Worker dry-run/deploy unless the deployment architecture is refactored.
- No production Cloudflare deployment, DNS mutation, credential mutation or remote D1 migration application was performed.

## Outstanding Gates

- Apply and verify `0035_staff_hr.sql` on the intended remote D1 database only when approved.
- Confirm the final deployment command shape for the split website/portal architecture.
- Rotate all temporary/shared credentials and enforce unique accounts.
- Complete Admin, Technician, Client, Finance and HR role QA with representative data.
- Confirm Admin/Finance MFA policy and HR delegated authority policy before real records are loaded.
- Complete POPIA/business sign-off for analytics.
- Keep Tequit as staging until explicit Kharon domain cutover approval.
