## 2025-02-23 - Prevent SQL Injection via Dynamic Table Names

**Vulnerability:** The data retention cron endpoint (`src/pages/portal/api/admin/data-retention-cron.ts`) constructed SQL queries using string interpolation (`${entityType}`) without validating the input. Since the input comes from database policies (and could potentially be supplied via JSON payload in the POST route), it opened up a SQL injection risk because table names cannot be parameterized with standard SQLite `?` bindings.
**Learning:** SQLite cannot parameterize identifiers like table or column names, necessitating string interpolation. Without strict input validation, this allows arbitrary SQL execution if an attacker can control or influence the interpolated value.
**Prevention:** Always validate dynamically interpolated table or column names against a strict regex (e.g., `/^[a-zA-Z0-9_]+$/`) or a known allowlist before execution.
