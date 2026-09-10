## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-10-24 - SQL Injection in Data Retention Cron
**Vulnerability:** Direct string interpolation of `entityType` and `dateColumn` in Cloudflare D1 SQL queries during data retention tasks.
**Learning:** Even though dynamic identifiers cannot be natively parameterized in SQL/SQLite, relying purely on database schema lookups (`sqlite_master`) does not sufficiently guard against malicious execution if inputs aren't strongly typed and verified upfront.
**Prevention:** Always use strict regex allowlists (e.g., `/^[a-zA-Z0-9_]+$/`) to validate dynamically passed table and column names before interpolation.
