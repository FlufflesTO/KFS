## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-09-24 - Optimizing D1 Dashboard Aggregations
**Learning:** Executing numerous independent COUNT(*) queries for different filters on the same table causes redundant table scans and increases latency in SQLite/Cloudflare D1.
**Action:** Group these queries by table and use conditional aggregation (SUM(CASE WHEN condition THEN 1 ELSE 0 END)) to retrieve multiple stats in a single table scan.
