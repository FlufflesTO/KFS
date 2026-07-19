## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-07-19 - Resolve N+1 D1 queries in HR Staff page
**Learning:** To avoid severe latency caused by N+1 queries in Cloudflare D1 loops (e.g. `Promise.all(members.map(...))`), fetch all related records in a single batched operation using an `IN (...)` clause with chunked parameter bindings (strict 100 max parameters per chunk) combined with `db.batch()`, and group the results in-memory.
**Action:** Replaced the `Promise.all()` iteration in `src/pages/portal/admin/hr.astro` with a new batched function `listStaffFilesForMembers` that groups results in-memory.
