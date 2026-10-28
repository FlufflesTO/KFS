## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Dashboard conditional aggregation
**Learning:** Combining multiple `COUNT(*)` queries on identical result sets into a single query using conditional aggregation (`SUM(CASE WHEN...)`) prevents multiple redundant index scans over the same data.
**Action:** Always prefer conditional aggregation over multiple `COUNT(*)` calls when retrieving multiple stats for the exact same filtered tables (like `jobs` or `defects`).
