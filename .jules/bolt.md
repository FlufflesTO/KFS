## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2024-03-05 - Conditional Aggregation for D1 Performance
**Learning:** Multiple independent `COUNT(*)` queries on the same table can cause redundant table scans in SQLite/Cloudflare D1, degrading performance.
**Action:** When replacing multiple `COUNT()` queries, combine them into a single query using conditional aggregation with `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)`. Preserve base `WHERE` filters to ensure index usage.
