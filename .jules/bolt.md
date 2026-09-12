## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-12 - Consolidate Multiple Dashboard Metric DB Queries
**Learning:** Multiple independent `COUNT(*)` queries on the same table can trigger redundant table scans in SQLite/Cloudflare D1.
**Action:** Use conditional aggregation (e.g., `SUM(CASE WHEN <condition> THEN 1 ELSE 0 END)`) inside a single query, which allows aggregating multiple metrics simultaneously and boosts query efficiency.
