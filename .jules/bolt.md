## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-10-20 - Consolidating redundant COUNT(*) queries
**Learning:** Consolidating multiple independent `COUNT(*)` database queries on the same table using conditional aggregation (`SUM(CASE WHEN ... THEN 1 ELSE 0 END)`) wrapped in `COALESCE(..., 0)` prevents redundant table scans in SQLite/Cloudflare D1, significantly reducing database execution time while maintaining accuracy.
**Action:** Group analytical queries targeting the same table and wrap the `SUM` with `COALESCE(..., 0)` to mimic `COUNT`'s behavior of returning `0` instead of `NULL`.
