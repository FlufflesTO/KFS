## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Dashboard Query Aggregation Optimization
**Learning:** Cloudflare D1/SQLite struggles with multiple individual `COUNT(*)` queries on the same tables when batched via `db.batch()`, causing redundant full table scans and high latency.
**Action:** Always refactor multiple boolean aggregation queries on the same table into a single scan utilizing conditional aggregation (e.g. `SUM(CASE WHEN status='Open' THEN 1 ELSE 0 END) AS openDefects`). For dashboard-style views that aggregate multiple separate tables, group these scans using a Cartesian join (`SELECT * FROM (SELECT ... FROM jobs) j, (SELECT ... FROM defects) d`).
