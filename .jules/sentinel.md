## 2025-06-08 - Refactoring the jobs POST API
**Vulnerability:** Complex routing structures can accidentally combine access boundaries.
**Learning:** Organizing route handling into separate functions ensures the exact required conditions can be met and reviewed more easily.
**Prevention:** Continuing to separate logical actions into bounded helper functions underneath standard access controls.
## 2025-06-08 - Path Traversal in File Uploads
**Vulnerability:** The regex used to sanitize filenames in file uploads only removed a subset of special characters, leaving sequences like `..` intact. This allowed path traversal sequences to escape the intended directory boundaries if the filename was later used in filesystem or storage path operations.
**Learning:** Basic regex substitution of non-alphanumeric characters is insufficient for path traversal protection if dot characters (`.`) are still permitted for file extensions.
**Prevention:** When sanitizing uploaded filenames, always explicitly strip directory traversal sequences (like `..`) or solely rely on the generated UUID for storage keys instead of incorporating user-provided input.
## 2026-10-06 - Fixing CI Action PowerShell Issues
**Vulnerability:** In Ubuntu CI runners, the `powershell` command may be missing or incompatible with scripts running as `pwsh` in `package.json`.
**Learning:** Ubuntu 24.04 and up have changes that might require mapping the `powershell` executable explicitly to `pwsh` using a symlink if `package.json` continues to use `powershell`.
**Prevention:** Symlinking `pwsh` to `powershell` (i.e. `sudo ln -sf /usr/bin/pwsh /usr/bin/powershell`) immediately after install in `.github/workflows/ci-cd.yml` avoids modifying every script in `package.json` and ensures compatibility.
