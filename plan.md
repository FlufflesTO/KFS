1. **Fix Playwright Flaky Tests in session.spec.ts**
   - The test `should set SameSite=Strict on session cookie` fails on mobile Android occasionally because `cookies.find()` returns an object missing `sameSite`. Why? Actually, mobile chromium doesn't always expose `sameSite` or `path` reliably in the `cookies()` API. However, in `auth.spec.ts`, there is:
     ```typescript
     test('should set HttpOnly session cookie with correct attributes', async ({ page }) => {
       await loginAsTestUser(page, 'admin');
       const cookies = await page.context().cookies();
       const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');
       expect(sessionCookie).toBeDefined();
       expect(sessionCookie?.httpOnly).toBe(true);
       expect(sessionCookie?.path).toBe('/portal');
       expect(sessionCookie?.sameSite).toBe('Strict');
     });
     ```
     This test passes. Wait, if it passes in `auth.spec.ts`, why does it fail in `session.spec.ts`? Maybe `auth.spec.ts` ran first, and by the time `session.spec.ts` runs, something is corrupted?
   - Wait, `should not expose session token in JavaScript` failed because it tried to evaluate `document.cookie` on an empty page:
     ```typescript
     test('should not expose session token in JavaScript', async ({ page }) => {
       await loginAsTestUser(page, 'admin');
       // Navigate to a valid domain page first to allow reading cookies for that origin
       await page.goto('/portal/login'); // ADD THIS
       const cookieValue = await page.evaluate(() => document.cookie.includes('kharon_session_token'));
       expect(cookieValue).toBe(false);
     });
     ```
     Because `loginAsTestUser` simply makes a `page.request.post('/portal/api/auth')`, the browser page doesn't actually navigate to the app domain. When it does `page.evaluate`, it's on `about:blank`, so it throws a `SecurityError`.

   - Let's fix `tests/integration/session.spec.ts`:
     For `should set SameSite=Strict on session cookie`, it expects `'Strict'`, but wait:
     ```typescript
     const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');
     expect(sessionCookie?.sameSite).toBe('Strict');
     ```
     If we don't navigate to the domain, `page.context().cookies()` might return cookies without full attributes if they were set purely via `APIRequestContext`.
     Let's add `await page.goto('/portal/login');` *before* getting cookies, or inside `loginAsTestUser`? No, we shouldn't change `loginAsTestUser` as it's used everywhere. Let's just navigate in the test. Wait, `auth.spec.ts` doesn't navigate. Let me check if `auth.spec.ts`'s test really passes on `[mobile-android-3g]`. Yes, it's explicitly listed as passed in the logs.
     Why did `should handle session revocation during active use` fail?
     ```typescript
     // Try to use revoked session
     const response = await page.request.get('/portal/admin/dashboard');
     expect(response.status()).toBe(302);
     ```
     It expected `302` but received `200`. Why did it receive `200`? If `logoutFromPortal` didn't actually log out (maybe due to missing CSRF token?). `logoutFromPortal` uses `page.request.post('/portal/api/logout', { headers: csrfToken ? ... })`. If the CSRF token was invalid, it would fail the logout!
     Wait, in `tests/integration/session.spec.ts`:
     ```typescript
     test('should handle session revocation during active use', async ({ page }) => {
       await loginAsTestUser(page, 'admin');
       // Logout to revoke session
       const logoutResponse = await logoutFromPortal(page);
       expect(logoutResponse.status()).toBe(200); // Add this check!
     ```
     I will add `expect(logoutResponse.status()).toBe(200);` to verify if the logout actually succeeded before trying to access the dashboard. If logout fails (e.g., 403 CSRF mismatch), it returns 200 on the dashboard request.

   - I will use `replace_with_git_merge_diff` to fix `session.spec.ts` for these flaky behaviors. I'll just add `await page.goto('/portal/login')` to ensure `document.cookie` can be evaluated safely.

2. **Fix `package.json` vs CI Environment Compatibility**
   - Wait, `session.spec.ts` is the *only* thing that failed in the last run. The CI workflow changes passed.
