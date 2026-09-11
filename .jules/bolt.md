## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2026-09-11 - JSON Aggregation for N+1 Queries
**Learning:** Resolving N+1 queries in Cloudflare D1 (SQLite) backend logic by replacing `Promise.all()` loops with `json_group_array` and `json_object` in SQL drastically reduces round-trip latency to the database.
**Action:** Always prefer fetching related one-to-many child records using SQLite's JSON aggregation instead of awaiting multiple individual queries inside map loops.
## 2026-09-11 - CSS Asset Budget Tracking
**Learning:** The project enforces a strict CSS asset budget checked by `audit-site.ts` which runs after the CSS purge script. Changing layout components or adding new UI elements can inadvertently bloat the CSS bundle over the 115KB limit, causing the CI pipeline to fail during deployment validation.
**Action:** Be mindful of adding unnecessary Tailwind classes or generic utility spans, as they increase the output of `purge-css.ts`. Always verify the output size using `npm run validate:site` if frontend code is touched.
