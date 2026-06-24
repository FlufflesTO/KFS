## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-06-24 - Optimizing concurrent D1 queries with db.batch
**Learning:** While `Promise.all()` with multiple `db.prepare().all()` calls parallelizes operations, it still triggers multiple HTTP roundtrips to the D1 API. Using `db.batch()` consolidates these into a single HTTP roundtrip, significantly reducing latency and lowering overhead, especially for multi-statement queries like client dashboards.
**Action:** Use `db.batch()` for parallel, independent D1 read queries instead of `Promise.all()`.
