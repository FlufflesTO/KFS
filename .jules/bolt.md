## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-10-15 - Dashboard Admin Stats SQL Optimization
**Learning:** Replacing multiple consecutive `COUNT(*)` queries with a single conditional aggregation `SUM(CASE WHEN ...)` query is a textbook optimization in Cloudflare D1 to eliminate redundant table scans. However, the exact syntax must handle SQLite edge cases by wrapping the sum in `COALESCE(..., 0)` to prevent nulls on empty tables.
**Action:** Always batch related dashboard queries using conditional aggregation while preserving base `WHERE` clause filters to maintain index usage.
