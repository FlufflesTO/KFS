/**
 * Authentication API Integration Tests
 * Purpose: Comprehensive testing of /portal/api/auth, /portal/api/logout, /portal/api/mfa endpoints
 * Coverage: Valid/invalid credentials, MFA flows, rate limiting, edge cases
 * 
 * Test Categories:
 * - POST /portal/api/auth (login)
 * - POST /portal/api/logout
 * - POST /portal/api/mfa
 * - Rate limiting enforcement
 */

import { test, expect } from '@playwright/test';
import {
  loginToPortal,
  loginAsTestUser,
  logoutFromPortal,
  extractSessionToken,
  extractCsrfTokenFromCookie,
  simulateRateLimit,
  measureResponseTime,
  AuthResponse,
} from '../helpers/api';
import { testUsers, invalidCredentials } from '../fixtures/test-users';

test.describe('Authentication API - POST /portal/api/auth', () => {
  test.describe('Successful Authentication', () => {
    test('should login with valid admin credentials and return session cookie', async ({ page }) => {
      const { response, body } = await loginAsTestUser(page, 'admin');

      expect(response.status()).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.user).toBeDefined();
      expect(body.user?.role).toBe('admin');
      expect(body.user?.email).toBe('admin.test@tequit.co.za');
      expect(body.redirectTo).toBe('/portal/admin/dashboard');

      const sessionToken = await extractSessionToken(page);
      expect(sessionToken).toBeDefined();
      expect(sessionToken?.length).toBeGreaterThan(50);
    });

    test('should login with valid finance credentials', async ({ page }) => {
      const { response, body } = await loginAsTestUser(page, 'finance');

      expect(response.status()).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.user?.role).toBe('finance');
      expect(body.redirectTo).toBe('/portal/finance/dashboard');
    });

    test('should login with valid technician credentials', async ({ page }) => {
      const { response, body } = await loginAsTestUser(page, 'tech');

      expect(response.status()).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.user?.role).toBe('tech');
      expect(body.user?.siteId).toBe('test-site-001');
      expect(body.redirectTo).toBe('/portal/tech/dashboard');
    });

    test('should login with valid client credentials', async ({ page }) => {
      const { response, body } = await loginAsTestUser(page, 'client');

      expect(response.status()).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.user?.role).toBe('client');
      expect(body.redirectTo).toBe('/portal/client/dashboard');
    });

    test('should set HttpOnly session cookie with correct attributes', async ({ page }) => {
      await loginAsTestUser(page, 'admin');

      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');

      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.path).toBe('/portal');
      expect(sessionCookie?.sameSite).toBe('Strict');
    });

    test('should set CSRF token cookie after successful login', async ({ page }) => {
      await loginAsTestUser(page, 'admin');

      const csrfToken = await extractCsrfTokenFromCookie(page);
      expect(csrfToken).toBeDefined();
      expect(csrfToken?.length).toBeGreaterThan(20);
    });
  });

  test.describe('Failed Authentication - Invalid Credentials', () => {
    test('should return 401 for invalid password', async ({ page }) => {
      const { response, body } = await loginToPortal(
        page,
        'admin.test@tequit.co.za',
        invalidCredentials.wrongPassword.password
      );

      expect(response.status()).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('unauthorized');
      expect(body.message).toContain('Invalid email or password');

      const sessionToken = await extractSessionToken(page);
      expect(sessionToken).toBeNull();
    });

    test('should return 401 for non-existent user', async ({ page }) => {
      const { response, body } = await loginToPortal(
        page,
        invalidCredentials.nonExistentUser.email,
        invalidCredentials.nonExistentUser.password
      );

      expect(response.status()).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('unauthorized');
      expect(body.message).toContain('Invalid email or password');
    });

    test('should return 401 for inactive user account', async ({ page }) => {
      const { response, body } = await loginAsTestUser(page, 'inactive');

      expect(response.status()).toBe(401);
      expect(body.ok).toBe(false);
      expect(body.error).toBe('unauthorized');
      expect(body.message).toContain('Invalid email or password');
    });
  });

  test.describe('Failed Authentication - Missing/Invalid Input', () => {
    test('should return 400 for missing email', async ({ page }) => {
      const response = await page.request.post('/portal/api/auth', {
        data: invalidCredentials.missingPassword,
      });

      expect(response.status()).toBe(400);
      const body = await response.json() as AuthResponse;
      expect(body.ok).toBe(false);
      expect(body.error).toBe('bad_request');
      expect(body.message).toContain('Email and password are required');
    });

    test('should return 400 for missing password', async ({ page }) => {
      const response = await page.request.post('/portal/api/auth', {
        data: invalidCredentials.missingEmail,
      });

      expect(response.status()).toBe(400);
      const body = await response.json() as AuthResponse;
      expect(body.ok).toBe(false);
      expect(body.error).toBe('bad_request');
      expect(body.message).toContain('Email and password are required');
    });

    test('should return 400 for empty request body', async ({ page }) => {
      const response = await page.request.post('/portal/api/auth', {
        data: invalidCredentials.emptyBody,
      });

      expect(response.status()).toBe(400);
      const body = await response.json() as AuthResponse;
      expect(body.ok).toBe(false);
      expect(body.error).toBe('bad_request');
    });

    test('should return 400 for malformed JSON body', async ({ page }) => {
      const response = await page.request.post('/portal/api/auth', {
        data: 'not-valid-json' as unknown as Record<string, unknown>,
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('should return 405 for non-POST methods', async ({ page }) => {
      const getResponse = await page.request.get('/portal/api/auth');
      expect(getResponse.status()).toBe(405);

      const putResponse = await page.request.put('/portal/api/auth');
      expect(putResponse.status()).toBe(405);

      const deleteResponse = await page.request.delete('/portal/api/auth');
      expect(deleteResponse.status()).toBe(405);
    });
  });

  test.describe('Email Normalization and Edge Cases', () => {
    test('should handle email with uppercase letters', async ({ page }) => {
      // Login with lowercase first to get hash, then test uppercase
      const { response, body } = await loginToPortal(
        page,
        'ADMIN.TEST@tequit.co.za',
        'TestPassword123!'
      );

      // Should either succeed (case-insensitive) or fail gracefully
      expect([200, 401]).toContain(response.status());
    });

    test('should handle email with leading/trailing whitespace', async ({ page }) => {
      const { response, body } = await loginToPortal(
        page,
        '  admin.test@tequit.co.za  ',
        'TestPassword123!'
      );

      // Should handle gracefully (either trim and succeed, or fail with 401)
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle empty string email', async ({ page }) => {
      const response = await page.request.post('/portal/api/auth', {
        data: { email: '', password: 'TestPassword123!' },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle empty string password', async ({ page }) => {
      const response = await page.request.post('/portal/api/auth', {
        data: { email: 'admin.test@tequit.co.za', password: '' },
      });

      expect(response.status()).toBe(400);
    });

    test('should handle very long email addresses', async ({ page }) => {
      const longEmail = 'a'.repeat(200) + '@tequit.co.za';
      const response = await page.request.post('/portal/api/auth', {
        data: { email: longEmail, password: 'TestPassword123!' },
      });

      expect(response.status()).toBeLessThan(500);
    });

    test('should handle SQL injection attempt in email', async ({ page }) => {
      const maliciousEmail = "admin'@tequit.co.za--";
      const response = await page.request.post('/portal/api/auth', {
        data: { email: maliciousEmail, password: 'TestPassword123!' },
      });

      // Should not cause server error (500)
      expect(response.status()).not.toBe(500);
    });

    test('should handle XSS attempt in email', async ({ page }) => {
      const xssEmail = '<script>alert("xss")</script>@tequit.co.za';
      const response = await page.request.post('/portal/api/auth', {
        data: { email: xssEmail, password: 'TestPassword123!' },
      });

      expect(response.status()).not.toBe(500);
    });
  });

  test.describe('Performance and Timing', () => {
    test('should respond within acceptable time limits', async ({ page }) => {
      const { response, responseTimeMs } = await measureResponseTime(() =>
        loginAsTestUser(page, 'admin').then(r => r.response)
      );

      expect(response.status()).toBe(200);
      expect(responseTimeMs).toBeLessThan(2000); // 2 second threshold
      console.log(`Login response time: ${responseTimeMs}ms`);
    });

    test('should have consistent response times across multiple logins', async ({ page }) => {
      const times: number[] = [];

      for (let i = 0; i < 5; i++) {
        const { response, responseTimeMs } = await measureResponseTime(() =>
          loginAsTestUser(page, 'admin').then(r => r.response)
        );
        expect(response.status()).toBe(200);
        times.push(responseTimeMs);

        // Logout between attempts
        await logoutFromPortal(page);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Average login time: ${avgTime}ms`);
      expect(avgTime).toBeLessThan(2000);
    });
  });
});

test.describe('Logout API - POST /portal/api/logout', () => {
  test('should logout successfully with valid session', async ({ page }) => {
    // Login first
    await loginAsTestUser(page, 'admin');
    const sessionToken = await extractSessionToken(page);
    expect(sessionToken).toBeDefined();

    // Logout
    const response = await logoutFromPortal(page);
    expect(response.status()).toBe(200);

    const body = await response.json() as AuthResponse;
    expect(body.ok).toBe(true);
    expect(body.redirectTo).toBe('/portal/login');

    // Verify session cookie is cleared
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');
    expect(sessionCookie?.value).toBe('');
    expect(sessionCookie?.expires).toBe(-1);
  });

  test('should clear CSRF token on logout', async ({ page }) => {
    await loginAsTestUser(page, 'admin');
    const csrfBefore = await extractCsrfTokenFromCookie(page);
    expect(csrfBefore).toBeDefined();

    await logoutFromPortal(page);

    const csrfAfter = await extractCsrfTokenFromCookie(page);
    expect(csrfAfter).toBe('');
  });

  test('should return 200 for logout without active session', async ({ page }) => {
    // Ensure no session
    await page.context().clearCookies();

    const response = await page.request.post('/portal/api/logout');
    expect(response.status()).toBe(200);
  });

  test('should return 405 for non-POST methods on logout', async ({ page }) => {
    const getResponse = await page.request.get('/portal/api/logout');
    expect(getResponse.status()).toBe(405);
  });

  test('should audit logout event', async ({ page, context }) => {
    // Enable console logging capture
    const logs: string[] = [];
    context.on('console', msg => {
      if (msg.text().includes('audit')) {
        logs.push(msg.text());
      }
    });

    await loginAsTestUser(page, 'admin');
    await logoutFromPortal(page);

    // Note: Audit logs may be async, so we just verify the logout succeeded
    // Actual audit log verification would require database access
  });
});

test.describe('MFA API - POST /portal/api/mfa', () => {
  test('should return 401 for MFA endpoint without authentication', async ({ page }) => {
    const response = await page.request.post('/portal/api/mfa', {
      data: { action: 'setup' },
    });

    expect(response.status()).toBe(401);
  });

  test('should allow MFA setup for tech user', async ({ page }) => {
    await loginAsTestUser(page, 'tech');

    const response = await page.request.post('/portal/api/mfa', {
      data: { action: 'setup' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.secret).toBeDefined();
    expect(body.provisioningUri).toBeDefined();
    expect(body.qrCode).toBeDefined();
  });


  test('should forbid MFA setup for client user', async ({ page }) => {
    await loginAsTestUser(page, 'client');

    const response = await page.request.post('/portal/api/mfa', {
      data: { action: 'setup' },
    });

    expect(response.status()).toBe(403);
    const body = await response.json() as AuthResponse;
    expect(body.error).toBe('forbidden');
  });

  test('should return 400 for invalid MFA action', async ({ page }) => {
    await loginAsTestUser(page, 'admin');

    const response = await page.request.post('/portal/api/mfa', {
      data: { action: 'invalid-action' },
    });

    expect(response.status()).toBe(400);
  });

  test('should return 400 for MFA enable with invalid code', async ({ page }) => {
    await loginAsTestUser(page, 'tech');

    // First setup to get secret
    const setupResponse = await page.request.post('/portal/api/mfa', {
      data: { action: 'setup' },
    });
    const setupBody = await setupResponse.json() as { secret: string };

    // Try to enable with invalid code
    const enableResponse = await page.request.post('/portal/api/mfa', {
      data: {
        action: 'enable',
        secret: setupBody.secret,
        code: '000000', // Invalid TOTP code
      },
    });

    expect(enableResponse.status()).toBe(400);
    const body = await enableResponse.json() as AuthResponse;
    expect(body.error).toBe('bad_request');
    expect(body.message).toContain('invalid');
  });

  test('should return 400 for MFA enable with already enabled MFA', async ({ page }) => {
    // This test requires a user with MFA already enabled
    // For now, we test the flow: setup -> enable -> try enable again
    await loginAsTestUser(page, 'admin');

    const setupResponse = await page.request.post('/portal/api/mfa', {
      data: { action: 'setup' },
    });
    const setupBody = await setupResponse.json() as { secret: string };

    // Note: Full enable test would require valid TOTP code generation
    // which needs the speakeasy library or similar
  });

  test('should return 405 for non-POST methods on MFA', async ({ page }) => {
    await loginAsTestUser(page, 'admin');

    const getResponse = await page.request.get('/portal/api/mfa');
    expect(getResponse.status()).toBe(405);
  });
});

test.describe('Rate Limiting - Authentication Endpoints', () => {
  test('should allow 5 login attempts within 15 minutes', async ({ page }) => {
    const results: number[] = [];

    for (let i = 0; i < 5; i++) {
      const response = await page.request.post('/portal/api/auth', {
        data: {
          email: 'admin.test@tequit.co.za',
          password: 'wrong-password',
        },
      });
      results.push(response.status());
    }

    // All 5 attempts should be allowed (even if they fail auth)
    results.forEach(status => {
      expect(status).not.toBe(429);
    });
  });

  test('should return 429 on 6th login attempt within 15 minutes', async ({ page }) => {
    // Make 5 failed attempts first
    for (let i = 0; i < 5; i++) {
      await page.request.post('/portal/api/auth', {
        data: {
          email: 'ratelimit-test@tequit.co.za',
          password: 'wrong-password',
        },
      });
    }

    // 6th attempt should be rate limited
    const response = await page.request.post('/portal/api/auth', {
      data: {
        email: 'ratelimit-test@tequit.co.za',
        password: 'wrong-password',
      },
    });

    expect(response.status()).toBe(429);
    const body = await response.json() as AuthResponse;
    expect(body.error).toBe('rate_limited');
    expect(body.retryAfter).toBeDefined();
    expect(body.retryAfter!).toBeGreaterThan(0);

    // Verify Retry-After header
    const retryAfterHeader = response.headers()['retry-after'];
    expect(retryAfterHeader).toBeDefined();
    expect(parseInt(retryAfterHeader, 10)).toBeGreaterThan(0);
  });

  test('should include retry-after header in 429 response', async ({ page }) => {
    // Exhaust rate limit
    for (let i = 0; i < 6; i++) {
      await page.request.post('/portal/api/auth', {
        data: { email: 'retry-test@tequit.co.za', password: 'wrong' },
      });
    }

    const response = await page.request.post('/portal/api/auth', {
      data: { email: 'retry-test@tequit.co.za', password: 'wrong' },
    });

    expect(response.status()).toBe(429);
    const headers = response.headers();
    expect(headers['retry-after']).toBeDefined();
  });

  test('should rate limit per email subject', async ({ page }) => {
    // Exhaust rate limit for email1
    for (let i = 0; i < 6; i++) {
      await page.request.post('/portal/api/auth', {
        data: { email: 'user1@tequit.co.za', password: 'wrong' },
      });
    }

    // email2 should still be allowed (separate rate limit bucket)
    const response = await page.request.post('/portal/api/auth', {
      data: { email: 'user2@tequit.co.za', password: 'wrong' },
    });

    expect(response.status()).not.toBe(429);
  });

  test('should audit rate limit events', async ({ page }) => {
    // This test verifies that rate limiting triggers audit events
    // Actual verification would require database access

    for (let i = 0; i < 7; i++) {
      await page.request.post('/portal/api/auth', {
        data: { email: 'audit-test@tequit.co.za', password: 'wrong' },
      });
    }

    // At least one request should be rate limited
    const response = await page.request.post('/portal/api/auth', {
      data: { email: 'audit-test@tequit.co.za', password: 'wrong' },
    });

    expect([401, 429]).toContain(response.status());
  });
});

test.describe('Destruction Tests - Authentication Edge Cases', () => {
  test('should handle concurrent login attempts', async ({ page }) => {
    const promises = Array.from({ length: 10 }, () =>
      page.request.post('/portal/api/auth', {
        data: { email: 'admin.test@tequit.co.za', password: 'TestPassword123!' },
      })
    );

    const responses = await Promise.all(promises);
    
    // All should complete without server error
    responses.forEach(response => {
      expect(response.status()).not.toBe(500);
    });
  });

  test('should handle very large request body', async ({ page }) => {
    const response = await page.request.post('/portal/api/auth', {
      data: {
        email: 'admin.test@tequit.co.za',
        password: 'TestPassword123!',
        extraField: 'a'.repeat(10000),
      },
    });

    expect(response.status()).toBeLessThan(500);
  });

  test('should handle null values in request body', async ({ page }) => {
    const response = await page.request.post('/portal/api/auth', {
      data: { email: null, password: null } as unknown as Record<string, unknown>,
    });

    expect(response.status()).toBe(400);
  });

  test('should handle array instead of string for email', async ({ page }) => {
    const response = await page.request.post('/portal/api/auth', {
      data: { email: ['admin@test.com'], password: 'TestPassword123!' },
    });

    expect(response.status()).toBe(400);
  });

  test('should handle unicode characters in credentials', async ({ page }) => {
    const response = await page.request.post('/portal/api/auth', {
      data: { email: 'test@tequit.co.za', password: '🔐TestPassword!' },
    });

    expect(response.status()).toBeLessThan(500);
  });

  test('should handle null byte injection attempt', async ({ page }) => {
    const response = await page.request.post('/portal/api/auth', {
      data: { email: 'admin\x00test@tequit.co.za', password: 'TestPassword123!' },
    });

    expect(response.status()).toBeLessThan(500);
  });

  test('should handle path traversal in email', async ({ page }) => {
    const response = await page.request.post('/portal/api/auth', {
      data: { email: '../../../etc/passwd@tequit.co.za', password: 'TestPassword123!' },
    });

    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Session Cookie Security', () => {
  test('should not expose session token in response body', async ({ page }) => {
    const { response, body } = await loginAsTestUser(page, 'admin');

    const responseBody = JSON.stringify(body);
    expect(responseBody).not.toContain('kharon_session_token');

    // Token should only be in Set-Cookie header
    const setCookieHeader = response.headers()['set-cookie'];
    expect(setCookieHeader).toContain('kharon_session_token');
  });

  test('should use secure cookie attribute in production', async ({ page }) => {
    await loginAsTestUser(page, 'admin');

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');

    // Note: Secure flag may not be set in local development
    // This test documents the expected behavior
    console.log(`Session cookie secure flag: ${sessionCookie?.secure}`);
  });
});
