## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2026-09-23 - Dynamic Table Name SQL Injection in Data Retention
**Vulnerability:** The data retention cron (`data-retention-cron.ts`) constructed dynamic SQL queries using unvalidated string interpolation for table names (`entityType`).
**Learning:** Cloudflare D1/SQLite doesn't support parameterized parameters `?` for table names. Because `entityType` came from the `data_retention_policies` table rather than direct user input, the SQL injection risk was less direct, but still violated strict defense-in-depth security standards for dynamic query construction.
**Prevention:** Always perform strict allowlist or regular expression validation (e.g. `/^[a-zA-Z0-9_]+$/`) on variables before interpolating them as table or column names in SQL queries.
