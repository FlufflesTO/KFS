## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-09-12 - Prevent SQL injection via dynamically interpolated table and column names
**Vulnerability:** In `data-retention-cron.ts`, `entityType` (table name) and `dateColumn` (column name) were being dynamically interpolated into the raw SQL string (e.g. `FROM ${entityType} WHERE ${dateColumn} < ?`) without validation. Although these are parameterized internally from the database (`data_retention_policies`), this still poses an injection risk if the DB policy values are poisoned or if logic changes to allow arbitrary inputs to the function calls.
**Learning:** Cloudflare D1 / SQLite does not allow table names or column names to be parameterized (with `?`) due to query compilation limitations. Developers might resort to unsafe template literals as a workaround.
**Prevention:** When query compilation requirements mandate template literal interpolation for dynamic elements like table or column names, always apply strict allowlisting (e.g. `if (!/^[a-zA-Z0-9_]+$/.test(identifier)) throw new Error("Invalid format");`) before they reach the execution scope.
