## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-09 - Conditional Aggregation Optimization
**Learning:** Combining queries that target identical record sets and identical logical filters using conditional aggregation `SUM(CASE WHEN...)` avoids redundant table/index scans in SQLite/D1, noticeably reducing `db.batch()` operations.
**Action:** When querying the same table with overlapping filters, use `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)` to execute a single pass over the records, rather than issuing multiple separate `COUNT(*)` queries.
