## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-10-17 - Optimizing dashboard stats batch queries
**Learning:** Consolidating multiple independent COUNT(*) queries on the same tables into single conditional aggregation queries (SUM(CASE WHEN...)) significantly reduces redundant table scans and JOIN operations in Cloudflare D1/SQLite. Wrapping sums in COALESCE is essential as SUM() returns NULL on empty sets, whereas COUNT() returns 0.
**Action:** When auditing data aggregation services (like reporting or dashboards), look for consecutive batch queries hitting the same base tables with different WHERE filters and consolidate them using conditional aggregation.
