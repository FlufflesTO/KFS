/**
 * Project Sentinel - Portal Middleware
 * Purpose: Enforces security headers, session verification, rate limits, and CSRF protection across all /portal paths
 * Dependencies: astro/middleware, ./lib/server/auth.js, ./lib/server/csrf.js, ./lib/server/bindings.js, ./lib/server/rateLimit.js, ./lib/server/audit.js
 * Structural Role: Central request interception and security enforcement layer
 */

import { defineMiddleware } from "astro/middleware";
import { sessionCookieName, verifySessionToken, isTokenRevoked, expiredSessionCookie } from "./lib/server/auth.js";
import { createCsrfToken, csrfCookie, csrfCookieName, csrfErrorResponse, verifyCsrfRequest, verifyCsrfToken } from "./lib/server/csrf.js";
import { getDatabase } from "./lib/server/bindings.js";
import { consumeRateLimit } from "./lib/server/rateLimit.js";
import { auditEvent } from "./lib/server/audit.js";

const loginPath = "/portal/login";
const authApiPath = "/portal/api/auth";
const resetPath = "/portal/reset";
const resetApiPath = "/portal/api/reset-password";
const logoutApiPath = "/portal/api/logout";
const passwordPath = "/portal/account/password";
const passwordApiPath = "/portal/api/change-password";
const mfaPath = "/portal/account/mfa";
const mfaApiPath = "/portal/api/mfa";
const portalRootPath = "/portal";

function createCspNonce() {
  return crypto.randomUUID().replaceAll("-", "");
}

function securityHeaders(nonce) {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy":
      `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://cdn.skypack.dev; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`,
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
  };
}

function withSecurityHeaders(response, nonce = createCspNonce()) {
  for (const [name, value] of Object.entries(securityHeaders(nonce))) {
    response.headers.set(name, value);
  }
  return response;
}

async function withHtmlSecurityHeaders(response, nonce) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return withSecurityHeaders(response, nonce);

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  const rewritten = html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
  return withSecurityHeaders(new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers
  }), nonce);
}

function redirectToLogin(context, nonce) {
  const loginUrl = new URL(loginPath, context.url);
  loginUrl.searchParams.set("next", context.url.pathname);
  return withSecurityHeaders(context.redirect(loginUrl.toString(), 302), nonce);
}

function redirectToRoleDashboard(context, role, nonce) {
  const destinations = {
    tech: "/portal/tech/dashboard",
    admin: "/portal/admin/dashboard",
    client: "/portal/client/dashboard",
    finance: "/portal/finance/dashboard"
  };

  return withSecurityHeaders(context.redirect(destinations[role] || loginPath, 302), nonce);
}

function allowedForPath(pathname, role) {
  if (pathname.startsWith("/portal/tech/")) return role === "tech" || role === "admin";
  if (pathname.startsWith("/portal/admin/")) return role === "admin";
  if (pathname.startsWith("/portal/finance/")) return role === "finance" || role === "admin";
  if (pathname.startsWith("/portal/client/")) return role === "client";
  return true;
}

function pathContainsTraversal(pathname) {
  try {
    return decodeURIComponent(pathname).split("/").some((segment) => segment === "..");
  } catch {
    return true;
  }
}

function isStateChangingPortalApi(request, pathname) {
  return pathname.startsWith("/portal/api/") && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
}

function rateLimitResponse(retryAfter, nonce) {
  return withSecurityHeaders(new Response(JSON.stringify({ ok: false, error: "rate_limited", message: "Too many portal write requests. Try again shortly.", retryAfter }), {
    status: 429,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(retryAfter)
    }
  }), nonce);
}

function rateLimitConfig(pathname) {
  const configs = {
    "/portal/api/maintenance-request": { scope: "portal.maintenance_request", maxAttempts: 10, windowSeconds: 15 * 60 },
    "/portal/api/approve-quote": { scope: "portal.quote_approval", maxAttempts: 20, windowSeconds: 15 * 60 },
    "/portal/api/job-status": { scope: "portal.job_status", maxAttempts: 30, windowSeconds: 15 * 60 },
    "/portal/api/job-visits": { scope: "portal.job_visits", maxAttempts: 40, windowSeconds: 15 * 60 },
    "/portal/api/submit-jobcard": { scope: "portal.jobcard_submit", maxAttempts: 20, windowSeconds: 15 * 60 },
    "/portal/api/change-password": { scope: "portal.change_password", maxAttempts: 10, windowSeconds: 15 * 60 },
    "/portal/api/mfa": { scope: "portal.mfa", maxAttempts: 20, windowSeconds: 15 * 60 },
    "/portal/api/logout": { scope: "portal.logout", maxAttempts: 20, windowSeconds: 15 * 60 },
    "/portal/api/finance/payments": { scope: "portal.finance.payments", maxAttempts: 40, windowSeconds: 15 * 60 },
    "/portal/api/admin/users": { scope: "portal.admin.users", maxAttempts: 60, windowSeconds: 15 * 60 },
    "/portal/api/admin/sites": { scope: "portal.admin.sites", maxAttempts: 60, windowSeconds: 15 * 60 },
    "/portal/api/admin/systems": { scope: "portal.admin.systems", maxAttempts: 60, windowSeconds: 15 * 60 },
    "/portal/api/admin/jobs": { scope: "portal.admin.jobs", maxAttempts: 60, windowSeconds: 15 * 60 },
    "/portal/api/admin/client-site-access": { scope: "portal.admin.client_site_access", maxAttempts: 60, windowSeconds: 15 * 60 },
    "/portal/api/admin/import": { scope: "portal.admin.import", maxAttempts: 20, windowSeconds: 15 * 60 },
    "/portal/api/admin/maintenance-requests": { scope: "portal.admin.maintenance_requests", maxAttempts: 60, windowSeconds: 15 * 60 }
  };

  return configs[pathname] || { scope: `portal.write.${pathname.replaceAll("/", ".")}`.slice(0, 80), maxAttempts: 45, windowSeconds: 15 * 60 };
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const nonce = createCspNonce();

  if (!pathname.startsWith("/portal")) {
    return withHtmlSecurityHeaders(await next(), nonce);
  }

  if (pathContainsTraversal(pathname)) {
    return withSecurityHeaders(new Response("Invalid portal path.", { status: 400 }), nonce);
  }

  if (pathname === loginPath || pathname === authApiPath || pathname === resetPath || pathname === resetApiPath) {
    return withHtmlSecurityHeaders(await next(), nonce);
  }

  const db = getDatabase();
  const token = context.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return redirectToLogin(context, nonce);
  }

  const user = await verifySessionToken(token);
  if (!user) {
    const response = redirectToLogin(context, nonce);
    response.headers.append("Set-Cookie", expiredSessionCookie());
    return response;
  }

  if (await isTokenRevoked(db, token)) {
    const response = redirectToLogin(context, nonce);
    response.headers.append("Set-Cookie", expiredSessionCookie());
    return response;
  }

  context.locals.user = user;

  let csrfToken = context.cookies.get(csrfCookieName)?.value;
  let shouldSetCsrfCookie = false;
  if (!(await verifyCsrfToken(csrfToken, user))) {
    csrfToken = await createCsrfToken(user);
    shouldSetCsrfCookie = true;
  }
  context.locals.csrfToken = csrfToken;

  if (isStateChangingPortalApi(context.request, pathname)) {
    if (!(await verifyCsrfRequest(context.request, user))) {
      await auditEvent(db, context.request, {
        eventType: "security.csrf",
        entityType: "portal_api",
        entityId: pathname,
        outcome: "blocked",
        user
      });
      return withSecurityHeaders(csrfErrorResponse(), nonce);
    }

    const config = rateLimitConfig(pathname);
    const limit = await consumeRateLimit(db, context.request, {
      scope: config.scope,
      subject: user.id,
      maxAttempts: config.maxAttempts,
      windowSeconds: config.windowSeconds
    });
    if (!limit.allowed) {
      await auditEvent(db, context.request, {
        eventType: "security.rate_limit",
        entityType: "portal_api",
        entityId: pathname,
        outcome: "blocked",
        metadata: { scope: config.scope, retryAfter: limit.retryAfter },
        user
      });
      return rateLimitResponse(limit.retryAfter, nonce);
    }
  }

  if (user.forcePasswordChange && pathname !== passwordPath && pathname !== passwordApiPath && pathname !== logoutApiPath) {
    const response = withSecurityHeaders(context.redirect(passwordPath, 302), nonce);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  if (user.mfaRequired && !user.mfaEnabled && pathname !== mfaPath && pathname !== mfaApiPath && pathname !== logoutApiPath) {
    const response = withSecurityHeaders(context.redirect(mfaPath, 302), nonce);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  if (pathname === portalRootPath || pathname === `${portalRootPath}/`) {
    const response = redirectToRoleDashboard(context, user.role, nonce);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  if (!allowedForPath(pathname, user.role)) {
    const response = redirectToRoleDashboard(context, user.role, nonce);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  const response = await withHtmlSecurityHeaders(await next(), nonce);
  if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
  return response;
});
