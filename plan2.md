1.  **Fix PowerShell Execution in CI Workflow**
    *   The CI is failing with `powershell: not found`. According to memory constraints: "If cross-platform PowerShell execution fails in Linux-based CI environments (like GitHub Actions) due to 'powershell: not found', do NOT modify package.json scripts if it violates project constraints. Instead, create a symlink in the CI workflow: `sudo ln -sf /usr/bin/pwsh /usr/bin/powershell`."
    *   We will use `replace_with_git_merge_diff` to add the symlink command to `.github/workflows/ci-cd.yml`.
