## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-06-08 - SQL Parameter Binding Issue
**Vulnerability:** A parameter binding mismatch vulnerability in `src/lib/server/services/dashboard-service.ts`.
**Learning:** The database query was improperly structuring its parameters because the starting index wasn't accurately calculated to account for manually bound properties preceding an `IN` clause array binding.
**Prevention:** Make sure dynamically structured statements correctly align their values to the SQL array indices.
