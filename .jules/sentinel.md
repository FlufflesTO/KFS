## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2025-06-09 - Safe Dynamic Table Names
**Vulnerability:** Dynamic table name interpolation (`FROM ${entityType}`) was incorrectly identified as an SQL injection vulnerability.
**Learning:** In SQLite environments (like Cloudflare D1), validating dynamic table names against `sqlite_master` safely prevents SQL injection before any interpolation occurs, eliminating the need for rigid whitelists that could break fallback logic.
**Prevention:** Avoid blindly applying static whitelists to dynamic table patterns when existence validation against standard schema tables is already in place.
