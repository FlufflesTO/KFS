## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Fixing N+1 query pattern with db.batch
**Learning:** When fetching nested entities inside a mapping function for multiple records, using Promise.all() leads to O(N) database queries which causes severe latency. Using D1's db.batch with chunking to group related queries works seamlessly and preserves in-memory grouping without hitting limits.
**Action:** Use listAllXForEntities rather than looping individual fetch requests when resolving multiple parent-child relations.
