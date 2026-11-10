## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-11-10 - Optimizing dashboard queries
**Learning:** Consolidating multiple similar `COUNT(*)` queries with overlapping `WHERE` clauses using conditional aggregation (`SUM(CASE WHEN...)`) reduces database round-trips and redundant table scans.
**Action:** Replaced separate `COUNT(*)` calls in `dashboard-service.ts` with grouped conditional aggregation for identical datasets.
