## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2024-05-18 - Avoid N+1 Queries in Staff HR View
**Learning:** Found an N+1 query vulnerability when loading the Admin HR view (`src/pages/portal/admin/hr.astro`). For every staff member, a separate query was made to fetch their files, which created excessive database roundtrips resulting in slow page loads for large teams.
**Action:** Replaced the N+1 queries with a single batch query in `src/lib/server/db/staff-repository.ts` that fetches all staff files. In `src/pages/portal/admin/hr.astro`, the returned list of all files is grouped into a map (using `reduce`) in memory and associated with each staff member, significantly reducing Cloudflare D1 database roundtrips.
