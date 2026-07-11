## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2026-07-11 - Don't bypass npm audit
**Vulnerability:** Bypassing npm audit with `|| true` in CI obscures security vulnerabilities and violates strict project conventions.
**Learning:** CI failures on `npm audit` should either be fixed with a minor package update or submitted with the failure intact to maintain visibility, rather than suppressed via workflow modification.
**Prevention:** Never modify the `npm audit` CI step to suppress errors. Either run `npm audit fix` if the update is non-breaking, or leave the failure if it requires breaking changes.
