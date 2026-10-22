## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-06-08 - Consolidate Multiple COUNT queries using Conditional Aggregation
**Learning:** To improve performance in SQLite/Cloudflare D1 by reducing redundant table scans, consolidate multiple independent `COUNT(*)` queries on the same table into a single query using conditional aggregation.
**Action:** Use `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)` on multiple query criteria sharing the same FROM and WHERE clauses instead of executing multiple batched single-count queries.
