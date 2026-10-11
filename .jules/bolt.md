## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-10-10 - Conditional Aggregation for Admin Dashboards
**Learning:** Cloudflare D1 network I/O dominates latency. The admin dashboard was making 15 distinct `COUNT(*)` trips. By grouping `SELECT COUNT(*)` where clauses into a single `SELECT SUM(CASE WHEN ... THEN 1 ELSE 0 END)` query on the same base tables, we reduce db connection overhead without changing application logic or output. Crucially, when swapping to `SUM()`, using `COALESCE(SUM(), 0)` guarantees exact parity with `COUNT()` when handling empty result sets (avoiding `NULL` errors).
**Action:** Always inspect repetitive `COUNT` operations targeting the same database tables in analytical features and consolidate them via conditional aggregation.
