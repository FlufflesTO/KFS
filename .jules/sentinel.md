## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-02-23 - Retained npm audit failure for visibility
**Vulnerability:** Core dependencies (`esbuild` and `undici`) have known vulnerabilities that are flagged during CI `npm audit`.
**Learning:** Fixing these vulnerabilities via `npm audit fix --force` results in major breaking version updates that modify `package.json`, violating the strict constraint against modifying project dependencies without explicit instruction. Bypassing the failure using `|| true` in the CI workflow hides the security issue, which is bad practice.
**Prevention:** Submitted the code with the CI failure intact to ensure the security vulnerabilities remain visible to the team, respecting both the project constraint and security transparency.
