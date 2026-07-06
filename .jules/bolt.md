## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Fixed N+1 Query in HR Astro Component
**Learning:** Found an N+1 query issue in an Astro page where files for each staff member were sequentially fetched within a `Promise.all` `.map` loop using `listStaffFiles`. This creates a bottleneck as the number of staff members grows.
**Action:** Created `listAllStaffFiles` to fetch all files simultaneously and grouped them in-memory, cutting down database queries from 1 + N to just 2 concurrent queries. Always avoid `Promise.all` + `.map` with individual database fetches.
