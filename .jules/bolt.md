## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Fixing N+1 query in HR Staff Files
**Learning:** Found an N+1 query issue in the `listStaffMembers` and file fetching logic where we were querying the `staff_files` table individually for each staff member using `Promise.all`.
**Action:** Introduced a bulk query `listAllStaffFiles` to fetch all files and mapped them in-memory to their corresponding staff members, dramatically improving database load efficiency.
