## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-12 - D1 Query Batching over Promise.all
**Learning:** For Cloudflare D1 database operations, using `Promise.all([db.prepare(...).all(), ...])` triggers multiple independent HTTP roundtrips, causing unnecessary latency.
**Action:** Always prefer `await db.batch([db.prepare(...), ...])` to bundle multiple distinct queries into a single HTTP roundtrip when fetching independent datasets for dashboards or aggregate views.
