# Kharon Portal Integration Test Suite

## Overview

Comprehensive integration tests for the Kharon Fire & Security Solutions portal authentication, session management, and role-based access control systems.

## Test Files

### 1. `tests/integration/auth.spec.ts` - Authentication Tests (51 tests)
Tests the `/portal/api/auth`, `/portal/api/logout`, and `/portal/api/mfa` endpoints.

**Coverage:**
- Valid credential authentication for all roles (admin, finance, tech, client)
- Invalid credential handling (wrong password, non-existent user, inactive account)
- Missing/invalid input validation (missing email, missing password, empty body, malformed JSON)
- Email normalization and edge cases (uppercase, whitespace, SQL injection, XSS)
- Performance and timing benchmarks
- Rate limiting (5 attempts per 15 minutes)
- MFA setup and validation flows
- Destruction tests (concurrent requests, large payloads, special characters)

### 2. `tests/integration/session.spec.ts` (75 tests)
Tests session cookie validation, CSRF protection, and session lifecycle.

**Coverage:**
- Valid session cookie authentication
- Expired/tampered/revoked session rejection
- Missing/empty/malformed session handling
- CSRF token validation (valid, missing, invalid, tampered)
- CSRF requirements for POST/PUT/PATCH/DELETE
- Session lifecycle (creation, destruction, expiration)
- Session security headers (HttpOnly, SameSite, Secure, Path)
- Concurrent session handling
- Destruction tests (long tokens, special characters, unicode, SQL injection)

### 3. `tests/integration/rbac.spec.ts` (89 tests)
Tests role-based access control for all user roles.

**Coverage:**
- **Admin Role:** Full access to admin paths, finance override, tech override, client override
- **Finance Role:** Finance paths only, denied admin/tech/client access
- **Technician Role:** Tech paths and job card submission, denied admin/finance/client
- **Client Role:** Client paths and own data only, denied all other roles
- Cross-role access denial verification
- Shared API access (profile, logout, password change, MFA)
- Path traversal prevention
- IDOR prevention
- MFA enforcement for elevated roles
- Destruction tests (role escalation, concurrent changes, special characters)

### 4. `tests/fixtures/test-users.ts` - Test User Fixtures
Standardized test user credentials and SQL seed data.

**Test Users:**
- `admin` - admin.test@kharon.co.za / TestPassword123!
- `finance` - finance.test@kharon.co.za / TestPassword123!
- `tech` - tech.test@kharon.co.za / TestPassword123!
- `client` - client.test@example.com / TestPassword123!
- `inactive` - inactive.test@kharon.co.za / TestPassword123!

### 5. `tests/helpers/api.ts` - API Test Helpers
Reusable utilities for API testing.

**Helpers:**
- `loginToPortal()` - Login with credentials
- `loginAsTestUser()` - Login with fixture user
- `logoutFromPortal()` - Logout
- `extractSessionToken()` - Get session cookie
- `extractCsrfTokenFromCookie()` - Get CSRF token
- `authenticatedRequest()` - Make authenticated API call
- `verifyRbacAccess()` - Test RBAC permissions
- `simulateRateLimit()` - Test rate limiting
- `measureResponseTime()` - Performance testing
- `tamperSessionToken()` - Security testing

## Running Tests

### Prerequisites

1. **Node.js**: >= 22.12.0
2. **Playwright**: Installed via `npm install`
3. **Database**: Local D1 database seeded with test users

### Database Setup

Before running integration tests, seed the test database:

```bash
# Seed test users
npx wrangler d1 execute kharon-portal --local --file=tests/fixtures/seed-test-users.sql

# Or run with SQL command
npx wrangler d1 execute kharon-portal --local --command="INSERT OR REPLACE INTO users..."
```

### Run All Integration Tests

```bash
npx playwright test tests/integration/
```

### Run Specific Test File

```bash
# Authentication tests
npx playwright test tests/integration/auth.spec.ts

# Session tests
npx playwright test tests/integration/session.spec.ts

# RBAC tests
npx playwright test tests/integration/rbac.spec.ts
```

### Run with UI (for debugging)

```bash
npx playwright test tests/integration/ --ui
```

### Run with Coverage

```bash
npx playwright test tests/integration/ --coverage
```

### Run Specific Test by Name

```bash
npx playwright test -g "should login with valid credentials"
```

### Run in Headless Mode (CI)

```bash
CI=true npx playwright test tests/integration/
```

## Test Output

### Expected Results

When tests pass successfully:
```
Running 215 tests using 1 worker

  ✓  1 tests/integration/auth.spec.ts:20:3 › Authentication API › should login with valid admin credentials (500ms)
  ✓  2 tests/integration/auth.spec.ts:35:3 › Authentication API › should login with valid finance credentials (450ms)
  ...
  ✓  215 tests/integration/rbac.spec.ts:600:3 › Destruction Tests › should handle null role (100ms)

  215 passed (45.2s)
```

### Test Report

After tests complete, an HTML report is generated:
```bash
npx playwright show-report
```

## Test Coverage Goals

| Category | Target | Status |
|----------|--------|--------|
| Authentication API | 90%+ | ✅ Implemented |
| Session Management | 90%+ | ✅ Implemented |
| RBAC | 90%+ | ✅ Implemented |
| Rate Limiting | 100% | ✅ Implemented |
| CSRF Protection | 100% | ✅ Implemented |
| Edge Cases | 90%+ | ✅ Implemented |

## Known Limitations

1. **Database Seeding**: Test users must be manually seeded before first run
2. **MFA Testing**: Full MFA flow testing requires TOTP code generation (speakeasy library)
3. **Real Session Expiry**: Testing actual 8-hour expiry requires time manipulation
4. **Cross-Browser Sessions**: Some tests document expected behavior but don't verify

## Troubleshooting

### Tests Fail with 401/403

**Cause**: Test users not seeded in database

**Solution**:
```bash
npx wrangler d1 execute kharon-portal --local --file=tests/fixtures/seed-test-users.sql
```

### Tests Timeout

**Cause**: Server not running or database locked

**Solution**:
```bash
# Kill any running preview servers
# Restart the preview server
npm run preview
```

### CSRF Token Errors

**Cause**: Session not properly established before API calls

**Solution**: Ensure `loginAsTestUser()` is called before making authenticated requests

### Rate Limit Tests Fail

**Cause**: Rate limit state persists between test runs

**Solution**: Clear rate limit table between tests or use unique email addresses

## Performance Benchmarks

| Operation | Target | Typical |
|-----------|--------|---------|
| Login | < 2000ms | 300-500ms |
| Logout | < 500ms | 100-200ms |
| RBAC Check | < 500ms | 50-150ms |
| CSRF Validation | < 100ms | 10-50ms |

## Security Testing

### Destruction Test Categories

1. **Input Fuzzing**: Malformed, unexpected, and extreme inputs
2. **Race Conditions**: Concurrent operations and timing issues
3. **Resource Exhaustion**: Large payloads, long strings
4. **Injection Attacks**: SQL injection, XSS attempts
5. **Session Manipulation**: Tampered tokens, cookie manipulation
6. **Path Traversal**: Directory traversal attempts
7. **Role Escalation**: Attempted privilege escalation

## Contributing

### Adding New Tests

1. Follow the existing test structure
2. Use descriptive test names: `should [action] when [condition]`
3. Group related tests with `test.describe()`
4. Use `test.beforeEach()` and `test.afterEach()` for setup/cleanup
5. Include both positive and negative test cases
6. Add destruction tests for edge cases

### Test Naming Convention

```typescript
test('should [expected behavior] when [condition]', async ({ page }) => {
  // Test implementation
});

test('should return [status code] for [input type]', async ({ page }) => {
  // Test implementation
});
```

## Maintenance

### Updating Test Users

When adding new roles or changing user schema, update:
1. `tests/fixtures/test-users.ts` - Test user definitions
2. `tests/fixtures/seed-test-users.sql` - SQL seed file

### Updating API Endpoints

When API endpoints change, update:
1. Path constants in test files
2. Expected response structures
3. RBAC path configurations

## Contact

For questions or issues with the test suite:
- Technical: admin@kharon.co.za
- Test Documentation: See `docs/` directory
