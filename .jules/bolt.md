## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-22 - Consolidate Multiple COUNT(*) Queries
**Learning:** Having multiple independent `COUNT(*)` queries on the same table causes redundant table scans and increases D1 execution time unnecessarily.
**Action:** Consolidate them into a single query using conditional aggregation like `SUM(CASE WHEN <condition> THEN 1 ELSE 0 END)` or `COUNT(DISTINCT CASE WHEN <condition> THEN column END)` and batch them for execution.
