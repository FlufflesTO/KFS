## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2023-11-20 - N+1 Query Optimization in hr.astro
**Learning:** `Promise.all` over a mapped array of database queries inside an Astro component (`await Promise.all(members.map(async m => await listStaffFiles(db, m.id)))`) creates an N+1 query problem, hitting the Cloudflare D1 API independently for every row.
**Action:** Replaced the N+1 `listStaffFiles` query with a single `listAllStaffFiles(db)` batch fetch, grouping results in-memory using `Array.reduce` to map files efficiently by `staff_member_id`.
