1. **Submit the PR**:
   - Use the `submit` tool with proper Bolt PR formatting (title and description) containing What, Why, Impact, and Measurement.
   - We will push the HR optimization and the CI `sudo ln -s pwsh` fix, and skip modifying the `npm audit` or `package.json` to NOT introduce CI bypasses.
   - `branch_name`: bolt/fix-hr-n-plus-1-query
   - `commit_message`: ⚡ Bolt: Fix N+1 query in admin HR page
   - `title`: ⚡ Bolt: Fix N+1 query in admin HR page
   - `description`:
     💡 What: Removed N+1 query in `hr.astro` and replaced it with a single bulk fetch `listAllStaffFiles`. Also added a pwsh alias in the CI action for compatibility.
     🎯 Why: Replaced `Promise.all` calling `listStaffFiles` per member, optimizing DB queries. `pwsh` alias ensures PowerShell scripts can be executed successfully in GitHub Actions CI where only `powershell` executable might be present.
     📊 Impact: Database round-trips reduced from O(N) to O(1) for loading the admin HR page. Fixed CI build process.
     🔬 Measurement: Run local HR page and monitor the reduced number of query calls in cloudflare D1. Checked CI execution log.
