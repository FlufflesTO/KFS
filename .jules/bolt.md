## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-19 - Consolidating redundant D1 table scans
**Learning:** In Cloudflare D1 (SQLite), running multiple independent COUNT(*) queries on the same table incurs unnecessary table scans and network round trips. Using conditional aggregation with SUM(CASE WHEN...) reduces query load and speeds up data fetching.
**Action:** Replaced 9 independent COUNT queries on dashboard tables with 5 queries utilizing conditional aggregation.
