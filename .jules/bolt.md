## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-07-04 - Fix N+1 Query in HR Admin Portal
**Learning:** In Cloudflare D1 serverless environments, executing multiple `.prepare().all()` queries inside a `Promise.all` loop (e.g. for fetching relationships) creates severe latency due to repeated HTTP API roundtrips.
**Action:** Always fetch all related records in a single batched query using an `IN (...)` clause with dynamically bound array placeholders (`.bind(...params)`), and then group the results in-memory.
