## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Consolidating COUNT Queries for Performance
**Learning:** Multiple independent `COUNT(*)` queries on the same table with overlapping JOIN conditions can be efficiently combined into a single query using conditional aggregation (`SUM(CASE WHEN...)`) to reduce database round-trips and table scans.
**Action:** When replacing `COUNT()` with `SUM()`, always wrap the `SUM()` expression in `COALESCE(..., 0)` to handle empty tables correctly, as `COUNT()` naturally returns 0 but `SUM()` over an empty result set returns `NULL`.
