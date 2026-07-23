## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-06-02 - Resolving Cloudflare D1 N+1 Queries
**Learning:** Cloudflare D1 has severe latency when making multiple query calls sequentially (e.g. inside a loop using `.map()` and `Promise.all()`). Furthermore, it imposes a strict 100 parameter limit for parameterized queries, which makes large `IN (...)` queries tricky.
**Action:** When fetching related collections for a list of items (e.g., files for multiple staff members), extract all keys and use `.batch()` containing batched `IN (...)` statements chunked at 100 IDs each. Group the resulting arrays by key in memory to eliminate N+1 latency without exceeding D1 parameter limits.
