## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-26 - Consolidating redundant table scans in backend services
**Learning:** SQLite backend queries executing multiple COUNT(*) aggregations on the same joins in separate queries can be optimized by using conditional aggregation (COALESCE(SUM(CASE WHEN...), 0)), which drastically reduces table scans while maintaining query intent.
**Action:** When calculating multiple aggregate statistics across the same tables (like dashboard summaries), combine them into a single conditional query block instead of parallel batch scans.
