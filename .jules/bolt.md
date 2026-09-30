## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Dashboard count query bottleneck
**Learning:** Multiple separate `COUNT(*)` queries using `db.batch()` still cause individual database roundtrips and query plan evaluations which can bottleneck high-traffic dashboards. SQLite/Cloudflare D1 is faster when doing conditional aggregation if the target table and JOIN conditions match.
**Action:** Replaced separate `COUNT(*)` queries in `dashboard-service.ts` with fewer `COALESCE(SUM(CASE WHEN <condition> THEN 1 ELSE 0 END), 0)` aggregations on shared base query structures to reduce database roundtrips by roughly 50%. Always use `COALESCE(..., 0)` since `SUM()` returns `NULL` for an empty result set.
