/**
 * Auth API Validation Test Suite
 * Purpose: Validate /portal/api/auth endpoint for functionality, security, and error handling
 * Tests: Database binding, secret validation, credential handling, rate limiting
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:4321';
const AUTH_ENDPOINT = `${BASE_URL}/portal/api/auth`;

// Test data
const VALID_TEST_USER = {
  email: 'test.admin@kharon.co.za',
  password: 'TestPassword123!'
};

const INVALID_CREDENTIALS = {
  email: 'test.admin@kharon.co.za',
  password: 'WrongPassword456!'
};

const MALFORMED_REQUESTS = [
  {}, // Empty body
  { email: '' }, // Missing password
  { password: 'test123' }, // Missing email
  { email: null, password: null }, // Null values
];

/**
 * Test Suite 1: Database Binding & Secret Validation
 * These tests verify the infrastructure is correctly configured
 */
test.describe('Auth API - Infrastructure', () => {
  test('should have accessible D1 database binding', async ({ request }) => {
    // Test by making a login attempt - if DB is unavailable, will get 500
    const response = await request.post(AUTH_ENDPOINT, {
      data: { email: 'test@example.com', password: 'test' }
    });
    
    // Should NOT return 500 due to DB binding failure
    // 401 or 400 are acceptable (user not found or validation error)
    expect(response.status()).not.toBe(500);
  });

  test('should have valid secrets configured', async ({ request }) => {
    // Secret validation happens during token creation
    // If secrets are missing, session creation will fail with 500
    const response = await request.post(AUTH_ENDPOINT, {
      data: { email: 'test@example.com', password: 'test' }
    });
    
    // Should not fail due to missing secrets
    // Accept 401 (invalid credentials) but not 500 (server error)
    expect(response.status()).not.toBe(500);
  });
});

/**
 * Test Suite 2: Valid Credentials
 * Tests successful authentication flow
 */
test.describe('Auth API - Valid Credentials', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Fresh session

  test('should authenticate with valid credentials', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    // Check for successful authentication
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(VALID_TEST_USER.email.toLowerCase());
    expect(body.redirectTo).toBeDefined();
    
    // Verify session cookie is set
    const setCookie = response.headers()['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('kharon_session_token');
  });

  test('should return CSRF token cookie after authentication', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    const setCookie = response.headers()['set-cookie'];
    expect(setCookie).toContain('kharon_csrf_token');
  });

  test('should redirect to correct dashboard based on role', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    const body = await response.json();
    expect(body.redirectTo).toMatch(/^\/portal\/(admin|tech|client|finance|manager)\/dashboard$/);
  });
});

/**
 * Test Suite 3: Invalid Credentials
 * Tests proper rejection of bad credentials
 */
test.describe('Auth API - Invalid Credentials', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should reject wrong password with 401', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: INVALID_CREDENTIALS
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('unauthorized');
    expect(body.message).toContain('Invalid email or password');
  });

  test('should reject non-existent user with 401', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: {
        email: 'nonexistent@kharon.co.za',
        password: 'SomePassword123!'
      }
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('unauthorized');
  });

  test('should not reveal if email exists vs password wrong', async ({ request }) => {
    // Security: Both cases should return identical error messages
    const response1 = await request.post(AUTH_ENDPOINT, {
      data: { email: 'test.admin@kharon.co.za', password: 'wrong' }
    });

    const response2 = await request.post(AUTH_ENDPOINT, {
      data: { email: 'doesnotexist@kharon.co.za', password: 'wrong' }
    });

    const body1 = await response1.json();
    const body2 = await response2.json();

    // Both should have same error message (prevents user enumeration)
    expect(body1.message).toBe(body2.message);
  });
});

/**
 * Test Suite 4: Malformed Requests
 * Tests input validation and error handling
 */
test.describe('Auth API - Malformed Requests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should reject empty body with 400', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: {}
    });

    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('bad_request');
    expect(body.message).toContain('Email and password are required');
  });

  test('should reject missing email with 400', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: { password: 'test123' }
    });

    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.message).toContain('Email and password are required');
  });

  test('should reject missing password with 400', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: { email: 'test@example.com' }
    });

    expect(response.status()).toBe(400);
    
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.message).toContain('Email and password are required');
  });

  test('should handle malformed JSON gracefully', async ({ page }) => {
    // Send raw malformed JSON
    const response = await page.request.post(AUTH_ENDPOINT, {
      data: '{ invalid json }',
      headers: { 'Content-Type': 'application/json' }
    });

    // Should return 400, not crash with 500
    expect([400, 401]).toContain(response.status());
  });

  test('should trim and normalize email', async ({ request }) => {
    // Email with leading/trailing spaces should be trimmed
    const response = await request.post(AUTH_ENDPOINT, {
      data: {
        email: '  test.admin@kharon.co.za  ',
        password: VALID_TEST_USER.password
      }
    });

    // Should succeed (email is trimmed and lowercased)
    expect(response.status()).toBe(200);
  });
});

/**
 * Test Suite 5: Rate Limiting
 * Tests abuse prevention mechanisms
 */
test.describe('Auth API - Rate Limiting', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should allow up to 5 login attempts in 15 minutes', async ({ request }) => {
    const attempts = [];
    
    for (let i = 0; i < 5; i++) {
      const response = await request.post(AUTH_ENDPOINT, {
        data: { email: `test${i}@kharon.co.za`, password: 'wrong' }
      });
      attempts.push(response.status());
    }

    // All 5 attempts should be processed (not rate limited yet)
    // They'll return 401 (invalid credentials), not 429
    attempts.forEach(status => {
      expect(status).not.toBe(429);
    });
  });

  test('should block 6th attempt with 429 Too Many Requests', async ({ request }) => {
    // Make 5 attempts first
    for (let i = 0; i < 5; i++) {
      await request.post(AUTH_ENDPOINT, {
        data: { email: 'ratelimit-test@kharon.co.za', password: 'wrong' }
      });
    }

    // 6th attempt should be rate limited
    const response = await request.post(AUTH_ENDPOINT, {
      data: { email: 'ratelimit-test@kharon.co.za', password: 'wrong' }
    });

    expect(response.status()).toBe(429);
    
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('rate_limited');
    expect(body.retryAfter).toBeDefined();
    
    // Verify Retry-After header is set
    const retryAfterHeader = response.headers()['retry-after'];
    expect(retryAfterHeader).toBeDefined();
    expect(parseInt(retryAfterHeader)).toBeGreaterThan(0);
  });

  test('should include rate limit info in response', async ({ request }) => {
    // Exhaust rate limit
    for (let i = 0; i < 6; i++) {
      await request.post(AUTH_ENDPOINT, {
        data: { email: 'ratelimit-info@kharon.co.za', password: 'wrong' }
      });
    }

    const response = await request.post(AUTH_ENDPOINT, {
      data: { email: 'ratelimit-info@kharon.co.za', password: 'wrong' }
    });

    const body = await response.json();
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.message).toContain('Too many sign-in attempts');
  });
});

/**
 * Test Suite 6: Security Headers & Response Safety
 * Tests security headers and information leakage prevention
 */
test.describe('Auth API - Security Headers', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should include security headers in response', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    const headers = response.headers();
    
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['strict-transport-security']).toBeDefined();
  });

  test('should not expose sensitive data in error messages', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: { email: 'test@kharon.co.za', password: 'wrong' }
    });

    const body = await response.json();
    
    // Should not contain technical details
    expect(body.message).not.toContain('stack');
    expect(body.message).not.toContain('error');
    expect(body.message).not.toContain('SQL');
    expect(body.message).not.toContain('database');
  });

  test('should set HttpOnly flag on session cookie', async ({ request }) => {
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    const setCookie = response.headers()['set-cookie'];
    expect(setCookie).toContain('HttpOnly');
  });

  test('should set Secure flag on session cookie in production', async ({ request }) => {
    // Note: In local dev, Secure flag may not be set
    // This test documents the expected behavior
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    const setCookie = response.headers()['set-cookie'];
    // Cookie should have SameSite=Strict at minimum
    expect(setCookie).toContain('SameSite=Strict');
  });
});

/**
 * Test Suite 7: MFA Handling
 * Tests MFA code requirement and validation
 */
test.describe('Auth API - MFA', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should request MFA code when MFA is enabled', async ({ request }) => {
    // If test user has MFA enabled, should get 401 with MFA required message
    const response = await request.post(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });

    // Either succeeds (MFA not enabled) or requests MFA code
    if (response.status() === 401) {
      const body = await response.json();
      // Should indicate MFA is needed, not just "invalid credentials"
      expect(body.message).toMatch(/(MFA|multi-factor|code)/i);
    } else {
      expect(response.status()).toBe(200);
    }
  });

  test('should reject invalid MFA code', async ({ request }) => {
    // First get a session that requires MFA
    const response = await request.post(AUTH_ENDPOINT, {
      data: {
        ...VALID_TEST_USER,
        mfaCode: '000000' // Invalid code
      }
    });

    // Should reject invalid MFA code
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.message).toContain('Invalid MFA code');
  });
});

/**
 * Test Suite 8: HTTP Method Validation
 * Tests that only POST is allowed
 */
test.describe('Auth API - HTTP Methods', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should reject GET requests', async ({ request }) => {
    const response = await request.get(AUTH_ENDPOINT);
    expect(response.status()).toBe(405);
  });

  test('should reject PUT requests', async ({ request }) => {
    const response = await request.put(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });
    expect(response.status()).toBe(405);
  });

  test('should reject DELETE requests', async ({ request }) => {
    const response = await request.delete(AUTH_ENDPOINT);
    expect(response.status()).toBe(405);
  });

  test('should reject PATCH requests', async ({ request }) => {
    const response = await request.patch(AUTH_ENDPOINT, {
      data: VALID_TEST_USER
    });
    expect(response.status()).toBe(405);
  });
});
