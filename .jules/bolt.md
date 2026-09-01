## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-01 - Optimizing HR staff loading to prevent N+1 queries
**Learning:** In SQLite/Cloudflare D1, querying child records in a loop (Promise.all mapping) causes severe N+1 latency. Using JSON aggregation (json_group_array combined with json_object) allows fetching the parent and all related child entities in a single database roundtrip, significantly improving performance.
**Action:** Replaced Promise.all loops mapping `listStaffFiles` with a single query using `json_group_array` in `listStaffMembersWithFiles`.
