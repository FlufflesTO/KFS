## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-01 - Consolidate Multiple Dashboard Queries
**Learning:** Cloudflare D1 (SQLite) performs much better when multiple independent `COUNT(*)` queries on the same table are combined into a single query using conditional aggregation with `SUM(CASE ...)`. When doing this, it's critical to use `COALESCE(SUM(CASE ...), 0)` because `SUM()` on an empty result set returns `NULL`, whereas `COUNT()` safely returns `0`.
**Action:** When calculating statistics across the same tables, avoid executing separate queries in `db.batch`. Instead, use single queries with conditional `COALESCE(SUM(CASE ...), 0)` to minimize table scans and improve D1 execution speed.
