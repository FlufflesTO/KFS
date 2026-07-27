## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Fixing N+1 Queries in Cloudflare D1
**Learning:** Performing multiple individual queries inside a `Promise.all()` (e.g. mapping over records and fetching related data) results in an N+1 query bottleneck which causes severe latency in Cloudflare D1. Furthermore, Cloudflare D1 enforces a strict maximum of 100 bind parameters per query.
**Action:** Replace `Promise.all()` mapping queries by collecting IDs, chunking them to a maximum of 100, generating `IN (...)` queries, executing them concurrently using `db.batch()`, and grouping the results in-memory.
