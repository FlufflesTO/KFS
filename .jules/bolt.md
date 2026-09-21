## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-09-21 - Consolidate COUNT(*) Queries
**Learning:** In SQLite/Cloudflare D1, redundant table scans for multiple independent `COUNT(*)` queries can cause significant performance bottlenecks.
**Action:** Replaced multiple independent `COUNT(*)` queries on the same table with a single query using conditional aggregation (`SUM(CASE WHEN <condition> THEN 1 ELSE 0 END)`) in the dashboard and compliance services.
