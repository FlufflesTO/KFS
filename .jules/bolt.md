## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-10-16 - Consolidating COUNT(*) Queries
**Learning:** In Cloudflare D1/SQLite, multiple  queries on the same table can be consolidated into a single query using conditional aggregation (). This reduces redundant table scans and network overhead.
**Action:** When gathering multiple counts from the same table (e.g., for dashboards), use conditional aggregation instead of firing parallel  queries.

## $(date +%Y-%m-%d) - Consolidating COUNT Queries
**Learning:** In Cloudflare D1/SQLite, multiple `COUNT(*)` queries on the same table can be consolidated into a single query using conditional aggregation (`COALESCE(SUM(CASE WHEN ... THEN 1 ELSE 0 END), 0)`). This reduces redundant table scans and network overhead.
**Action:** When gathering multiple counts from the same table (e.g., for dashboards), use conditional aggregation instead of firing parallel `COUNT(*)` queries.
