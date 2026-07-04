## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2023-10-25 - Avoid N+1 Queries in Cloudflare D1
**Learning:** Using loops with `Promise.all()` to execute individual queries severely impacts latency in Cloudflare D1 due to multiple HTTP roundtrips.
**Action:** Always fetch related records in a single batched query using an `IN (...)` clause and group the results in memory.
