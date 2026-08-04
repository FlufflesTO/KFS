## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-08-04 - Optimizing HR page N+1 queries using db.batch and IN clauses
**Learning:** `Promise.all` combined with `.map()` inside component initialization can cause severe latency by issuing hundreds of separate queries (N+1 query problem) in environments like Cloudflare D1. Furthermore, Cloudflare D1 has a hard limit of 100 bind parameters per query.
**Action:** When fetching related entities in a loop, always chunk the IDs into groups of < 100, use `db.batch()` with `IN (...)` to retrieve them efficiently, and group the results in-memory.
