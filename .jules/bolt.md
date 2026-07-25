## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2023-10-25 - Avoid N+1 queries in Cloudflare D1
**Learning:** Performing database queries inside `.map()` with `Promise.all()` causes severe N+1 latency issues with Cloudflare D1. Furthermore, Cloudflare D1 has a strict limit of 100 bind parameters per query.
**Action:** When fetching related records for a list of items, use batched `IN (...)` queries. To handle the 100-parameter limit, slice the IDs into chunks of 100 or fewer, execute the chunked queries concurrently using `db.batch()`, and group the results in-memory.
