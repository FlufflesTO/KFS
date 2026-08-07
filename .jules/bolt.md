## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2026-08-07 - Combine sequential queries using JOIN
**Learning:** Performing multiple sequential `SELECT` queries to fetch related entities based on an ID from the first query results in unnecessary N+1 round-trips to the database, creating a measurable performance bottleneck in worker/serverless environments.
**Action:** Always combine dependent lookups into a single `JOIN` query to reduce database round-trips when retrieving hierarchical or related records.
