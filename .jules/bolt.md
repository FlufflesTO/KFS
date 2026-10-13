## 2025-06-08 - Refactoring the jobs POST API
**Learning:** Refactoring overly long functions, especially those routing API endpoints based on payload actions, greatly improves maintainability.
**Action:** Extracted `markInvoiced` and `create/update` logic from `POST` in `src/pages/portal/api/admin/jobs.ts` into isolated async helper functions.

## 2023-10-13 - Consolidating independent scalar aggregates
**Learning:** In Cloudflare D1/SQLite, executing multiple independent scalar aggregate queries (like counts across completely different tables, e.g., jobs, systems, defects) can be combined into a single query using `CROSS JOIN` between single-row subselects. This eliminates multiple query parsing overheads and executes the scans in a single database roundtrip.
**Action:** When a service method (like `report-service.ts`) fetches independent dashboard counts from multiple tables, wrap each aggregate in a subselect and combine them with `CROSS JOIN` rather than issuing separate `SELECT` queries or overly fragmented batch statements.
