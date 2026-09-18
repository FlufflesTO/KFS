## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-09-18 - Consolidating COUNT queries using conditional aggregation
**Learning:** Performing multiple independent `COUNT(*)` queries on the same tables leads to redundant table scans and unnecessary database hits in SQLite/Cloudflare D1.
**Action:** Consolidate multiple `COUNT(*)` operations on the same base table and JOINs into a single query using conditional aggregation with `COUNT(CASE WHEN <condition> THEN 1 END)`.
