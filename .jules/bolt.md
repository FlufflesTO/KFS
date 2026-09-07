## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-07 - JSON Aggregation for N+1 Queries
**Learning:** N+1 queries in Cloudflare D1 can severely degrade backend performance when fetching parent-child entities.
**Action:** Use JSON aggregation (`json_group_array` combined with `json_object`) in SQL queries to fetch parent and all associated children in a single bulk database call, preventing performance penalties.
