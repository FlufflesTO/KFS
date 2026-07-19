## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.

## 2026-07-19 - Resolve CI audit failures
**Vulnerability:** CI failed on npm audit --omit=dev due to vulnerabilities in underlying dependencies (like esbuild).
**Learning:** Running npm audit fix --force caused major breaking version updates that modified package.json, violating project constraints.
**Prevention:** If npm audit fix --force breaks package.json constraints, restore package files and submit the code with the CI failure to respect the strict constraint against modifying package.json without explicit instruction.
