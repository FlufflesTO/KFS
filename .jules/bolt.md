## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-30 - Optimize Database Scans with Conditional Aggregation
**Learning:** Grouping multiple COUNT(*) queries that query the same table with the exact same WHERE clause filters but different conditional aggregation rules into a single query using COALESCE(SUM(CASE WHEN ... THEN 1 ELSE 0 END), 0) reduces redundant table scans.
**Action:** Apply conditional aggregation when querying the same table multiple times with exact identical WHERE base filters.
