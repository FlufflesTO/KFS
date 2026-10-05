## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-10-05 - Batch Database Query Optimization
**Learning:** Multiple separate `COUNT(*)` queries targeting the same table within a `db.batch()` array lead to redundant table scans and unnecessary database engine overhead. Grouping conditions using `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)` enables counting multiple states in a single query.
**Action:** When calculating dashboard statistics or aggregations, consolidate multiple conditional counts for the same table into a single `SUM(CASE WHEN)` query, maintaining a baseline `WHERE` clause to ensure index utilization and avoid full table scans.
