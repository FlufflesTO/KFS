## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-17 - Consolidating redundant COUNT queries
**Learning:** Issuing multiple `COUNT(*)` queries on the same table with slightly different conditions triggers repetitive full table scans in SQLite, degrading performance on dashboard loading.
**Action:** Replace multiple `COUNT(*)` queries with a single query using conditional aggregation `SUM(CASE WHEN <condition> THEN 1 ELSE 0 END)` to scan the table only once.
