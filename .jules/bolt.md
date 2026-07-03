## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2024-05-18 - Fix N+1 query pattern using batch/grouped queries in D1
**Learning:** Found an N+1 query bottleneck in `src/pages/portal/admin/hr.astro` where a `Promise.all` with a `.map()` iteration over results was running multiple D1 database queries. Because D1 incurs HTTP round-trip overhead for each query, this degrades performance significantly as the number of records increases.
**Action:** Always fetch related records using a single query (e.g., fetching all related entities active in the system, or using `IN (...)` with batched IDs) and group the results in-memory instead of executing queries in loops or `Promise.all()`.
