## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-25 - Optimizing D1 Queries with Conditional Aggregation
**Learning:** When retrieving multiple distinct counts from the same table (e.g., active vs unassigned jobs), running separate COUNT(*) queries causes redundant full index/table scans in SQLite/D1. Using COALESCE(SUM(CASE WHEN condition THEN 1 ELSE 0 END), 0) consolidates these into a single pass.
**Action:** Always prefer conditional aggregation over multiple COUNT(*) queries for the same table when fetching dashboard or admin stats, ensuring the base WHERE clause preserves index usage.
