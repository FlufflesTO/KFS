## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-07-09 - Fix N+1 queries using batched IN clauses
**Learning:** Resolving N+1 queries in D1 loops (e.g. `Promise.all` and `.map()`) via a single batched query with an `IN (...)` clause and in-memory grouping significantly reduces latency and improves performance by minimizing HTTP roundtrips.
**Action:** Replaced `.map()` + `Promise.all()` fetching related staff_files on the HR page with `listStaffFilesForMembers` using an `IN` clause to fetch all records in one query, then grouped the results in-memory.
