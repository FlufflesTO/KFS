1. **Fix missing ENVIRONMENT=local in CI**
   - The CI Playwright tests are failing on session cookies because they assert `sessionCookie?.sameSite === 'Strict'`, but the cookie is not being found in Playwright context or not being set properly because `Secure` flag is enforced.
   - We are testing over HTTP (`http://localhost:4321`) in `playwright.config.ts`.
   - When testing over HTTP, if `Secure` flag is set on the cookie, the browser rejects it, causing `cookies.find()` to return undefined.
   - The `sessionCookie()` function sets `Secure` unless `bindings.ENVIRONMENT === 'local'`.
   - We need to add `ENVIRONMENT=local` to the `.dev.vars` and `.env` in the GitHub Actions `ci-cd.yml` workflow file. This is explicitly stated in our memory constraints.

2. **Update `.github/workflows/ci-cd.yml`**
   - Use `replace_with_git_merge_diff` to add `ENVIRONMENT=local` to the `.dev.vars` and `.env` file generation in the `Prepare CI Local Secrets` step.

3. **Complete pre-commit steps**
   - Verify workflow file.

4. **Submit PR**
