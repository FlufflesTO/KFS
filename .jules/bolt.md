## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2025-06-08 - Eliminating N+1 queries in Staff File fetching
**Learning:** Using `Promise.all()` with N database queries inside a `.map()` loop (e.g. for staff members and files) results in a severe N+1 query penalty on the backend, increasing response times proportionally to the list size.
**Action:** Refactored `src/pages/portal/admin/hr.astro` to fetch all staff files in a single, bulk query (`listAllStaffFiles`), then group them in-memory, changing complexity from O(N) database trips to O(1) database trips.
