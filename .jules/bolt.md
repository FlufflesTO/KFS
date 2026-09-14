## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-14 - Fix N+1 query via JSON Aggregation
**Learning:** Using Promise.all with sequential database calls for related items causes significant N+1 slowdowns due to serverless database execution constraints.
**Action:** Use `json_group_array(CASE WHEN child.id IS NOT NULL THEN json_object(...) ELSE NULL END)` within the primary D1/SQLite query to fetch and group relational data in a single request, parsing it back in JavaScript. Remember to sort the JavaScript arrays explicitly, as JSON aggregation does not preserve order.
