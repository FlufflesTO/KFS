1. **Analyze the CI failure**: The job `build-test-deploy` failed at line 32 of `scripts/build-deploy-artifacts.ps1` with the error `Refusing to operate outside repository root: /home/runner/work/KFS/KFS/src/pages/portal`.
2. **Identify the root cause**:
   - The script `scripts/build-deploy-artifacts.ps1` defines an `Assert-RepoChild` function to prevent operating outside the repository.
   - It checks `$full.StartsWith($rootWithSlash, [System.StringComparison]::OrdinalIgnoreCase)`.
   - On Windows, `$Root` usually uses backslashes (e.g., `C:\...`), so `$rootWithSlash = $Root.TrimEnd('\') + '\'` works perfectly.
   - However, on Linux (which the Ubuntu GitHub Actions runner uses), paths use forward slashes (`/`).
   - If `$Root` is `/home/runner/work/KFS/KFS`, `.TrimEnd('\') + '\'` makes it `/home/runner/work/KFS/KFS\`.
   - `[System.IO.Path]::GetFullPath($Path)` of `src/pages/portal` returns `/home/runner/work/KFS/KFS/src/pages/portal`.
   - Comparing `/home/runner/work/KFS/KFS/src/pages/portal` to `/home/runner/work/KFS/KFS\` will fail because it does not start with that exact string. The backslash vs forward slash mismatch is the issue!
3. **Plan the fix**:
   - Update `Assert-RepoChild` in `scripts/build-deploy-artifacts.ps1` to use cross-platform path separators instead of hardcoded backslashes.
   - Use `[System.IO.Path]::DirectorySeparatorChar` or standard path manipulation methods.
   - Example fix:
     ```powershell
     $rootWithSlash = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
     ```
   - Actually, a safer cross-platform check using just PowerShell's string replacement might be:
     ```powershell
     $fullNormalized = $full.Replace('\', '/')
     $rootNormalized = $Root.Replace('\', '/').TrimEnd('/') + '/'
     if (-not ($fullNormalized -eq $rootNormalized.TrimEnd('/') -or $fullNormalized.StartsWith($rootNormalized, [System.StringComparison]::OrdinalIgnoreCase))) { ... }
     ```
4. **Execute the fix**: Modify the `Assert-RepoChild` function in `scripts/build-deploy-artifacts.ps1`.
5. **Test**: Since I don't have `pwsh` locally in the sandbox, I can write a quick node script to check the regex/replace logic, but the powershell string replace is straightforward.
6. **Pre-commit Steps**: `pre_commit_instructions`
7. **Submit**.
