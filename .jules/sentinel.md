## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2026-10-03 - Missing dependencies in CI Scripts
**Vulnerability:** Execution of development scripts (like `.ts` files) via utilities (like `tsx`) can fail silently or with unrelated error codes if the execution utility is missing from the explicit dependencies.
**Learning:** `tsx` is sometimes relied upon implicitly (or available in the host environment), but when it is missing in CI, it causes cryptic `exit code 1` or `127` errors that derail pipelines and mask security or testing feedback loops.
**Prevention:** Always explicitly install required execution utilities (like `npm install tsx -D`) if CI steps running scripts unexpectedly fail with missing package warnings.
