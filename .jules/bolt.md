## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2024-05-18 - Fix N+1 Query in HR Page
**Learning:** Found an N+1 query problem on the Cloudflare D1 database where the application was looping through staff members and running a separate query `listStaffFiles` for each member's files using `Promise.all()`. This creates numerous network round-trips from the Worker to the D1 API, leading to high latency.
**Action:** When querying multiple related records, replace `Promise.all` with a single `db.batch` call to fetch all records simultaneously in one HTTP request, then group the records in-memory by their foreign keys to avoid the N+1 problem.
