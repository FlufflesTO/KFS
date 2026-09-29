## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-09-29 - Consolidating SQL Aggregations
**Learning:** When using `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` to replace `COUNT()` for aggregating data over a table, you must explicitly wrap it in `COALESCE(SUM(...), 0)`. While `COUNT(*)` safely returns `0` when there are no matching rows, `SUM()` on an empty result set yields `NULL`.
**Action:** Always wrap `SUM` inside a conditional aggregation query with `COALESCE(..., 0)` to guarantee predictable return types and prevent downstream data contract violations.
