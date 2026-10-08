## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-08 - Consolidating D1 Batch Queries with Conditional Aggregation
**Learning:** In Cloudflare D1/SQLite, executing multiple `COUNT(*)` queries on the same tables within a `db.batch()` still causes redundant table scans and increases execution time.
**Action:** Use conditional aggregation (e.g., `COALESCE(SUM(CASE WHEN <cond> THEN 1 ELSE 0 END), 0)`) to consolidate redundant queries into a single query, significantly reducing the number of queries executed per request and lowering D1 compute overhead.
