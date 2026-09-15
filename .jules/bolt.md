## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-15 - Prevented N+1 queries in HR portal by using json_group_array
**Learning:** In Cloudflare D1/SQLite, fetching related entities inside a mapped Promise.all() causes severe N+1 performance penalties.
**Action:** Replaced the mapped individual db calls with json_group_array and json_object to aggregate file records into a single parent-child query.
