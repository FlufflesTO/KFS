## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Consolidating redundant queries using conditional aggregation
**Learning:** In the Cloudflare D1 environment, batching multiple `COUNT(*)` queries using `this.db.batch()` still executes full table scans for each query if they target the same table. This adds unnecessary I/O overhead.
**Action:** When multiple `COUNT(*)` queries target the exact same table and base `WHERE` filters, consolidate them into a single query using `COALESCE(SUM(CASE WHEN ... THEN 1 ELSE 0 END), 0)`. This reduces table scans and execution time.
