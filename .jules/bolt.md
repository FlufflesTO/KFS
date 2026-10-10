## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Consolidating Database Queries with Conditional Aggregation
**Learning:** Cloudflare D1/SQLite table scans can be heavily optimized by combining multiple independent `COUNT(*)` queries on the same table into a single query using conditional aggregation (`SUM(CASE WHEN ...)`). Crucially, `SUM()` on an empty result set returns `NULL`, whereas `COUNT()` returns `0`, so you must always wrap the conditional sums in `COALESCE(..., 0)`.
**Action:** Always look for blocks of parallel queries targeting the same table and consolidate them to eliminate redundant D1 roundtrips and table scans, ensuring fallback logic like `COALESCE` is applied correctly.
