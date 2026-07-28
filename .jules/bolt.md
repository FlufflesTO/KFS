## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-07-28 - Batching Cloudflare D1 Queries to Fix N+1
**Learning:** Executing queries inside a .map() with Promise.all() leads to severe latency due to Cloudflare D1 round-trip costs and N+1 query patterns. D1 also limits bind parameters to 100 per query, making large IN (...) clauses fail.
**Action:** Replaced Promise.all() query loops with a single batched query using db.batch() and chunking to handle parameter limits, grouping results in memory.
