## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Dashboard Database Query Optimization
**Learning:** Using conditional aggregation (`COALESCE(SUM(CASE WHEN condition THEN 1 ELSE 0 END), 0)`) can drastically reduce database roundtrips and redundant table scans when fetching multiple independent counts from the same table in Cloudflare D1/SQLite.
**Action:** When pulling numerous aggregate stats for dashboards or reports, group queries by the base table and apply conditional aggregation rather than issuing dozens of separate `COUNT(*)` queries. Remember to retain the core `WHERE` filters (like `deleted_at IS NULL`) outside the `SUM` to keep indexes effective.
