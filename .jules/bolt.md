## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2023-10-27 - Fixing N+1 Queries in Astro Backend endpoints
**Learning:** Performing database queries within `Promise.all` mapping over records (e.g. `listStaffFiles` over each staff member) triggers multiple N HTTP round-trips to the Cloudflare D1 database API, which significantly degrades server performance on Cloudflare Workers.
**Action:** Always fetch all related records using a single batch query (e.g. `listAllStaffFiles` missing `staff_member_id` filter) and group the result sets in memory using `Array.reduce` to map related collections efficiently.
