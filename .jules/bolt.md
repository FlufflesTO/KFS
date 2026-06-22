## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-06-22 - DB Batching vs Promise.all for Cloudflare D1
**Learning:** When executing multiple independent Cloudflare D1 database queries, using `db.batch` instead of `Promise.all` consolidates them into a single HTTP roundtrip to the D1 API, significantly reducing latency.
**Action:** Replaced `Promise.all` with `db.batch` in `getClientDashboardData`.
