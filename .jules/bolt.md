## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Optimized N+1 query in Admin HR Portal
**Learning:** Replaced a Promise.all + .map pattern inside hr.astro with a single chunked IN (...) query in db.batch to avoid severe Cloudflare D1 latency caused by multiple queries.
**Action:** Grouped records in memory after calling the new listStaffFilesBatch function to reconstruct the related records for each staff member without degrading performance.
