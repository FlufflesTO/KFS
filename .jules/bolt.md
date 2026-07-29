## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-07-29 - Resolve N+1 query issue in D1
**Learning:** When retrieving records for multiple related entities in Cloudflare D1, iterating with an array map to call the database in parallel can result in severe latency and timeout issues due to N+1 queries.
**Action:** Replaced looped queries with batched 'IN' statements that chunk the input parameters array to respect D1's 100 parameter limit, fetching all related files efficiently in a single batched query step, which drastically reduces database calls and connection load.
