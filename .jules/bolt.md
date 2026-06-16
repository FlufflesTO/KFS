## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-16 - D1 Database N+1 Query Optimization in Loops
**Learning:** Using `Promise.all` mapped over database queries inside loops creates an N+1 query bottleneck because it triggers multiple independent HTTP roundtrips to the Cloudflare D1 API.
**Action:** Used `listAllStaffFiles` to fetch all necessary records in a single batched D1 query, reducing the D1 API roundtrips, and then grouped the results in-memory.
