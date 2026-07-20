## 2024-07-20 - Defense-in-depth Authentication

**Vulnerability:** Found a missing authentication check on `src/pages/portal/admin/api/multi-client.ts`, which allowed unauthenticated or unauthorized users to fetch all client data.

**Learning:** `src/middleware.ts`'s path-based validation checks authorization based on routes, but it relies on an explicit list of paths (or path prefixes). For API endpoints under `src/pages/portal/admin/api/`, while the middleware might catch them if configured correctly via `/portal/admin/`, the endpoints themselves lacked the defense-in-depth explicit `requireAdmin(locals.user)` check that is present in other admin API endpoints like `src/pages/portal/api/admin/users.ts`.

**Prevention:** For security in Astro API endpoints (e.g., admin or sensitive data routes), explicitly call the relevant authorization guards (like `requireAdmin(locals.user)`) within the endpoint code as defense-in-depth, rather than relying entirely on path-based validation in `src/middleware.ts`.

## 2024-07-20 - CI Build Fix

**Vulnerability:** Not a vulnerability, but a CI build failure.

**Learning:** GitHub Actions ubuntu-24.04 environment has `pwsh` installed for PowerShell, but the npm scripts expect `powershell` to exist. Attempting to install `powershell` with `apt-get` directly may succeed but leave only `pwsh`.

**Action:** In CI pipelines or environments where `powershell` is not found but `pwsh` exists, symlink `pwsh` to `powershell` using `sudo ln -s /usr/bin/pwsh /usr/bin/powershell` to fix script execution. Or, alternatively, the project's instructions should be updated to use `pwsh`.

## 2024-07-20 - CI Audit Fix


**Vulnerability:** Dependency Audit failed in CI.

**Learning:** When `npm audit fix --force` updates dependencies, it creates or modifies `package-lock.json` and updates `package.json`. The memory dictates: "If resolving CI package vulnerability audits (e.g., via `npm audit fix --force`) results in major breaking version updates to core dependencies that modify `package.json`, restore `package.json` and `package-lock.json` and submit the code with the CI failure to respect the strict constraint against modifying `package.json` without explicit instruction."

**Action:** Restored `package.json` and `package-lock.json` (if created) to their original state and submit the PR with the CI failure intact, preserving the strict project rules.

**Vulnerability:** Dependency Audit failed in CI.

**Learning:** When `npm audit fix --force` updates dependencies, it creates or modifies `package-lock.json` and updates `package.json`. The memory dictates: "If resolving CI package vulnerability audits (e.g., via `npm audit fix --force`) results in major breaking version updates to core dependencies that modify `package.json`, restore `package.json` and `package-lock.json` and submit the code with the CI failure to respect the strict constraint against modifying `package.json` without explicit instruction."

**Action:** Restored `package.json` and `package-lock.json` (if created) to their original state and submit the PR with the CI failure intact, preserving the strict project rules.
