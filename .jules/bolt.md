## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Use conditional aggregation to avoid multiple scans in batched Cloudflare D1 Queries
**Learning:** Even within batched requests to D1, multiple `COUNT(*)` queries with slightly different `WHERE` clauses on the same tables trigger full redundant table scans.
**Action:** When aggregating various metrics on the same base tables (e.g. jobs, defects, certificates), group them into a single query using `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`. This drastically reduces scans and optimizes dashboard data fetching. Note: It is important to wrap the `SUM()` with `COALESCE(..., 0)` since `SUM()` returns `NULL` on an empty set while `COUNT()` returns `0`.
