## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-07 - Optimize Admin Dashboard Stats queries
**Learning:** `COUNT(*)` queries on a base table don't need expensive `JOIN`s to linked entities if the filter condition can be satisfied solely by checking the base table (or when `JOIN` doesn't change the cardinality due to 1:1 or N:1 relationships without filtering requirements on the joined tables). Unnecessary `JOIN`s drastically decrease database performance on large datasets.
**Action:** Avoid joining tables in statistical `COUNT(*)` aggregate queries when the query conditions can be fulfilled by the primary base table.
