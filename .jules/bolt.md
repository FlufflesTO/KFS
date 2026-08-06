## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.
## 2025-06-08 - Concurrent API fetching in finance tasks
**Learning:** Sequential `await` calls for independent database queries or external service requests (like `getFinanceSummary` and `getPendingTasks`) introduce unnecessary latency in API endpoints.
**Action:** Use `Promise.all` to fetch independent data concurrently in API endpoints, reducing overall response time by parallelizing the work.
