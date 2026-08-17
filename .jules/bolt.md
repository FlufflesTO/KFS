## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-17 - Optimizing dashboard queries with Promise.all
**Learning:** Sequential database queries using `Promise.all` can be optimized by using Cloudflare D1's native `db.batch()` to combine multiple queries into a single roundtrip, significantly reducing network latency.
**Action:** Replaced `Promise.all` with `db.batch()` in `getClientDashboardData` within `src/lib/server/db-optimization.ts` to improve dashboard load times.
