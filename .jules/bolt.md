## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Resolve N+1 queries using IN clause
**Learning:** Resolving N+1 database queries by batch fetching entities using `IN (...)` is more performant than iterating via `Promise.all`. The in-memory map structure efficiently groups data to relate the entities after query execution.
**Action:** Use batch operations instead of running single record queries within `Promise.all` loops.
