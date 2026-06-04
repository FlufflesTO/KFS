/**
 * API Test Helpers
 * Purpose: Provides reusable API testing utilities for Playwright integration tests
 * Includes: Authentication, CSRF handling, session management, and RBAC testing
 */

import { Page, APIRequestContext, APIResponse } from '@playwright/test';
import { testUsers, TestUser } from '../fixtures/test-users';

/**
 * API Response types for type-safe assertions
 */
export interface AuthResponse {
  ok: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    siteId: string | null;
    forcePasswordChange: boolean;
    mfaRequired: boolean;
    mfaEnabled: boolean;
  };
  redirectTo?: string;
  error?: string;
  message?: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
  retryAfter?: number;
}

/**
 * Extract CSRF token from HTML content or response
 */
export async function extractCsrfToken(page: Page): Promise<string | null> {
  const csrfInput = page.locator('input[name="kharon_csrf_token"]');
  const token = await csrfInput.getAttribute('value');
  return token;
}

/**
 * Extract CSRF token from cookies
 */
export async function extractCsrfTokenFromCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find(c => c.name === 'kharon_csrf_token');
  return csrfCookie?.value || null;
}

/**
 * Extract session token from cookies
 */
export async function extractSessionToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');
  return sessionCookie?.value || null;
}

/**
 * Login to the portal and return authentication response
 */
export async function loginToPortal(
  page: Page,
  email: string,
  password: string,
  mfaCode?: string
): Promise<{ response: APIResponse; body: AuthResponse }> {
  const response = await page.request.post('/portal/api/auth', {
    data: {
      email,
      password,
      mfaCode: mfaCode || undefined,
    },
  });

  const body = await response.json() as AuthResponse;
  return { response, body };
}

/**
 * Login using test user fixture
 */
export async function loginAsTestUser(
  page: Page,
  userKey: keyof typeof testUsers,
  mfaCode?: string
): Promise<{ response: APIResponse; body: AuthResponse }> {
  const user = testUsers[userKey];
  return loginToPortal(page, user.email, user.password, mfaCode);
}

/**
 * Logout from the portal
 */
export async function logoutFromPortal(page: Page): Promise<APIResponse> {
  const response = await page.request.post('/portal/api/logout');
  return response;
}

/**
 * Create an authenticated API request context with session cookies
 */
export async function createAuthenticatedContext(
  page: Page,
  user: TestUser
): Promise<{
  context: APIRequestContext;
  sessionToken: string;
  csrfToken: string;
}> {
  // Login first
  const { response: loginResponse } = await loginToPortal(page, user.email, user.password);
  
  if (loginResponse.status() !== 200) {
    throw new Error(`Login failed with status ${loginResponse.status()}`);
  }

  // Extract session token from cookies
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');
  const csrfCookie = cookies.find(c => c.name === 'kharon_csrf_token');

  if (!sessionCookie?.value) {
    throw new Error('Session cookie not set after login');
  }

  return {
    context: page.request,
    sessionToken: sessionCookie.value,
    csrfToken: csrfCookie?.value || '',
  };
}

/**
 * Make an authenticated API request with CSRF token
 */
export async function authenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: unknown,
  options?: {
    csrfToken?: string;
    extraHeaders?: Record<string, string>;
  }
): Promise<APIResponse> {
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'kharon_session_token');
  const csrfToken = options?.csrfToken || cookies.find(c => c.name === 'kharon_csrf_token')?.value;

  const headers: Record<string, string> = {
    ...(options?.extraHeaders || {}),
  };

  // Add CSRF token header for state-changing requests
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['x-csrf-token'] = csrfToken;
  }

  const response = await page.request[method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete'](
    url,
    data ? { data, headers } : { headers }
  );

  return response;
}

/**
 * Wait for and verify a toast notification
 */
export async function waitForToast(page: Page, expectedText: string, options?: { timeout?: number }) {
  const toast = page.locator('#operations-toast');
  await expect(toast).toBeVisible({ timeout: options?.timeout || 5000 });
  await expect(toast).toContainText(expectedText);
}

/**
 * Simulate rate limiting by making multiple rapid requests
 */
export async function simulateRateLimit(
  page: Page,
  url: string,
  method: 'POST' = 'POST',
  maxAttempts: number = 10
): Promise<{
  successfulAttempts: number;
  rateLimitedAt: number;
  responses: APIResponse[];
}> {
  const responses: APIResponse[] = [];
  let rateLimitedAt = -1;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await page.request[method.toLowerCase() as 'post'](url, {
      data: { email: 'test@example.com', password: 'test' },
    });
    responses.push(response);

    if (response.status() === 429) {
      rateLimitedAt = i + 1;
      break;
    }
  }

  return {
    successfulAttempts: rateLimitedAt > 0 ? rateLimitedAt - 1 : responses.length,
    rateLimitedAt,
    responses,
  };
}

/**
 * Verify RBAC access control for a specific role and path
 */
export async function verifyRbacAccess(
  page: Page,
  user: TestUser,
  path: string,
  expectedAccess: boolean
): Promise<{
  allowed: boolean;
  response: APIResponse;
  statusCode: number;
}> {
  await loginToPortal(page, user.email, user.password);
  
  const response = await page.request.get(path);
  const statusCode = response.status();
  
  // 2xx = allowed, 3xx redirect or 4xx/5xx = denied
  const allowed = statusCode >= 200 && statusCode < 300;
  
  await logoutFromPortal(page);
  
  return {
    allowed,
    response,
    statusCode,
  };
}

/**
 * Generate a tampered session token for testing
 */
export function tamperSessionToken(token: string): string {
  if (!token || !token.includes('.')) {
    return 'invalid';
  }
  
  const [payload, signature] = token.split('.');
  // Tamper with the payload
  const tamperedPayload = payload.substring(0, payload.length - 5) + 'TAMPERED';
  return `${tamperedPayload}.${signature}`;
}

/**
 * Wait for API response with retry logic for flaky tests
 */
export async function waitForApiResponse(
  requestFn: () => Promise<APIResponse>,
  options?: {
    maxRetries?: number;
    retryDelayMs?: number;
    expectedStatus?: number;
  }
): Promise<APIResponse> {
  const maxRetries = options?.maxRetries || 3;
  const retryDelayMs = options?.retryDelayMs || 100;
  const expectedStatus = options?.expectedStatus;

  let lastResponse: APIResponse | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await requestFn();
      lastResponse = response;

      if (expectedStatus === undefined || response.status() === expectedStatus) {
        return response;
      }

      lastError = new Error(`Expected status ${expectedStatus}, got ${response.status()}`);
    } catch (error) {
      lastError = error as Error;
    }

    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Measure API response time
 */
export async function measureResponseTime(
  requestFn: () => Promise<APIResponse>
): Promise<{
  response: APIResponse;
  responseTimeMs: number;
}> {
  const startTime = Date.now();
  const response = await requestFn();
  const responseTimeMs = Date.now() - startTime;
  
  return { response, responseTimeMs };
}

/**
 * Import expect from Playwright for use in helpers
 */
import { expect } from '@playwright/test';
