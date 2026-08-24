## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-08-24 - Resolving N+1 database queries with JSON aggregation
**Learning:** In SQLite/D1, fetching a list of entities and their children separately leads to N+1 queries. Using `json_group_array` combined with `json_object` allows fetching the parent and all its children in a single query, significantly improving performance.
**Action:** Used JSON aggregation in the `listStaffMembers` query to fetch staff members and their associated files in one go instead of looping with `Promise.all`.
