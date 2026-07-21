## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-06-25 - Cloudflare D1 Batched N+1 Queries & Parameter Limit
**Learning:** When removing N+1 queries in Cloudflare D1 by switching to `IN (...)` batched fetches, D1 has a hard limit of 100 bind parameters per query. If the array of parameters exceeds this, the query will fail.
**Action:** When executing batch queries using `IN (...)` on Cloudflare D1, always slice the input array into chunks of 99 or fewer. Prepare individual statements for each chunk and pass them concurrently using `db.batch(queries)` to maintain performance while avoiding parameter limits. Then reconstruct the data in-memory on the application side.
