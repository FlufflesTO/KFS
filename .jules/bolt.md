## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Use json_group_array to fix N+1 queries
**Learning:** Using `Promise.all` with a `.map` loop to execute individual queries for each related child record creates an N+1 query problem, which is especially expensive on Cloudflare D1 due to HTTP overhead.
**Action:** Use `json_group_array` with `json_object` in the initial SQL query to aggregate the children in a single database call. Because SQLite's `json_group_array` does not always respect subquery ordering, the parsed array must be sorted in JavaScript. Also, ensure you use a `CASE WHEN child.id IS NOT NULL` condition to prevent inserting dummy objects when there are no related rows.
