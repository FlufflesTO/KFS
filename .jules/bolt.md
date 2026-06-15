## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2024-05-18 - Fix N+1 query in Admin HR page
**Learning:** Found an N+1 query pattern where the system was fetching staff files individually for each staff member inside a Promise.all loop on the HR page. This triggers multiple roundtrips to the Cloudflare D1 database.
**Action:** Replaced the N+1 query by introducing a new repository function `listAllStaffFiles` to fetch all files in a single batch. Grouping is now done in-memory via reduce to avoid separate roundtrips per staff member.
