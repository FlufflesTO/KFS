## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2023-10-25 - Prevent N+1 Query in Cloudflare D1
**Learning:** `Promise.all()` fetching related rows individually leads to an N+1 query issue. Cloudflare D1 (SQLite) lacks `LATERAL` joins but fully supports json functions like `json_group_array(json_object(...)) FILTER (WHERE ...)` which is highly efficient for aggregating related children (1:N) inside a single SQL query, reducing network latency.
**Action:** Use `json_group_array` + `FILTER (WHERE id IS NOT NULL)` inside query aggregations when mapping related models, rather than querying relations in `.map()` with `Promise.all()`.
