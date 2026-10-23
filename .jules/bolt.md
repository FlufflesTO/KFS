## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Optimizing conditional aggregations
**Learning:** Optimizing SQL queries with `COUNT(CASE WHEN...)` and `SUM(CASE WHEN...)` should be combined with an overall `WHERE` clause if the conditions apply to the entire query scope, enabling index usage. Utilizing `COALESCE(SUM(...), 0)` prevents null returns on empty result sets and maintains type safety.
**Action:** When filtering aggregated datasets based on status or type, ensure the root query leverages indices via a `WHERE` clause instead of solely relying on inline case conditions that force full table scans.
