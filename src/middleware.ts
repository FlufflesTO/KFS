/**
 * Project Sentinel - Portal Middleware
 * Purpose: Enforces security headers, session verification, rate limits, and CSRF protection across all /portal paths
 * Dependencies: astro:middleware, ./lib/server/auth.js, ./lib/server/csrf.js, ./lib/server/bindings.ts, ./lib/server/rateLimit.js, ./lib/server/audit
 * Structural Role: Central request interception and security enforcement layer
 */

// @ts-ignore - defineMiddleware is used implicitly through MiddlewareHandler type
import { sequence } from "astro:middleware";
import type { MiddlewareHandler } from "astro";
import { sessionCookieName, verifySessionToken, isTokenRevoked, expiredSessionCookie } from "./lib/server/auth.js";
import { createCsrfToken, csrfCookie, csrfCookieName, csrfErrorResponse, verifyCsrfRequest, verifyCsrfToken } from "./lib/server/csrf.js";
import { getDatabase } from "./lib/server/bindings.ts";
import { consumeRateLimit } from "./lib/server/rateLimit.js";
import { auditEvent } from "./lib/server/audit";

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

function createCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function securityHeaders(nonce: string): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy":
      `default-src 'none'; script-src 'strict-dynamic' 'nonce-${nonce}' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://plausible.io https://cdn.skypack.dev; script-src-attr 'none'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://cloudflareinsights.com https://plausible.io; frame-src https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests; manifest-src 'self'`,
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"
  };
}

function withSecurityHeaders(response: Response, nonce: string = createCspNonce()): Response {
  for (const [name, value] of Object.entries(securityHeaders(nonce))) {
    response.headers.set(name, value);
  }
  return response;
}

async function withHtmlSecurityHeaders(response: Response, nonce: string = createCspNonce()): Promise<Response> {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return withSecurityHeaders(response, nonce);

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  const rewritten = html.replace(/<script\b(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`).replace(/<style\b(?![^>]*\bnonce=)/gi, `<style nonce="${nonce}"`);
  return withSecurityHeaders(new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers
  }), nonce);
}

function redirectToLogin(context: any, nonce: string = createCspNonce()): Response {
  const loginUrl = new URL(loginPath, context.url);
  loginUrl.searchParams.set("next", context.url.pathname);
  return withSecurityHeaders(context.redirect(loginUrl.toString(), 302), nonce);
}

function redirectToRoleDashboard(context: any, role: string, nonce: string = createCspNonce()): Response {
  const destinations: Record<string, string> = {
    tech: "/portal/tech/dashboard",
    admin: "/portal/admin/dashboard",
    client: "/portal/client/dashboard",
    finance: "/portal/finance/dashboard"
  };

  return withSecurityHeaders(context.redirect(destinations[role] || loginPath, 302), nonce);
}

function allowedForPath(pathname: string, role: string): boolean {
  if (pathname.startsWith("/portal/account/")) return true;
  
  if (pathname.startsWith("/portal/api/tech/")) return role === "tech" || role === "admin";
  if (pathname.startsWith("/portal/api/admin/")) return role === "admin";
  if (pathname.startsWith("/portal/api/finance/")) return role === "finance" || role === "admin";
  if (pathname.startsWith("/portal/api/client/")) return role === "client" || role === "admin";
  if (pathname.startsWith("/portal/api/")) return true;

  if (pathname.startsWith("/portal/tech/")) return role === "tech" || role === "admin";
  if (pathname.startsWith("/portal/admin/")) return role === "admin";
  if (pathname.startsWith("/portal/finance/")) return role === "finance" || role === "admin";
  if (pathname.startsWith("/portal/client/")) return role === "client" || role === "admin";
  
  return false;
}

function pathContainsTraversal(pathname: string): boolean {
  try {
    const decodedPath = decodeURIComponent(pathname);
    return decodedPath.split("/").some((segment) => segment === ".." || segment === ".");
  } catch {
    return true;
  }
}

function isStateChangingPortalApi(request: Request, pathname: string): boolean {
  return (pathname.startsWith("/portal/api/") || pathname.startsWith("/portal/admin/api/"))
    && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
}

function rateLimitResponse(retryAfter: number, nonce: string = createCspNonce()): Response {
  return withSecurityHeaders(new Response(JSON.stringify({ ok: false, error: "rate_limited", message: "Too many portal write requests. Try again shortly.", retryAfter }), {
    status: 429,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(retryAfter)
    }
  }), nonce);
}

function rateLimitConfig(pathname: string) {
  const configs: Record<string, any> = {
    "/portal/api/auth": { scope: "portal.auth.login", maxAttempts: 5, windowSeconds: 900 },
    "/portal/api/reset-password": { scope: "portal.auth.reset", maxAttempts: 3, windowSeconds: 3600 },
    "/portal/api/change-password": { scope: "portal.change_password", maxAttempts: 5, windowSeconds: 900 },
    "/portal/api/mfa": { scope: "portal.mfa", maxAttempts: 5, windowSeconds: 900 },
    "/portal/api/logout": { scope: "portal.logout", maxAttempts: 10, windowSeconds: 900 },
    "/portal/api/maintenance-request": { scope: "portal.maintenance_request", maxAttempts: 10, windowSeconds: 900 },
    "/portal/api/approve-quote": { scope: "portal.quote_approval", maxAttempts: 20, windowSeconds: 900 },
    "/portal/api/job-status": { scope: "portal.job_status", maxAttempts: 30, windowSeconds: 900 },
    "/portal/api/job-visits": { scope: "portal.job_visits", maxAttempts: 40, windowSeconds: 900 },
    "/portal/api/submit-jobcard": { scope: "portal.jobcard_submit", maxAttempts: 20, windowSeconds: 900 },
    "/portal/api/finance/payments": { scope: "portal.finance.payments", maxAttempts: 40, windowSeconds: 900 },
    "/portal/api/admin/users": { scope: "portal.admin.users", maxAttempts: 60, windowSeconds: 900 },
    "/portal/api/admin/sites": { scope: "portal.admin.sites", maxAttempts: 60, windowSeconds: 900 },
    "/portal/api/admin/systems": { scope: "portal.admin.systems", maxAttempts: 60, windowSeconds: 900 },
    "/portal/api/admin/jobs": { scope: "portal.admin.jobs", maxAttempts: 60, windowSeconds: 900 },
    "/portal/api/admin/client-site-access": { scope: "portal.admin.client_site_access", maxAttempts: 60, windowSeconds: 900 },
    "/portal/api/admin/import": { scope: "portal.admin.import", maxAttempts: 20, windowSeconds: 900 },
    "/portal/api/admin/maintenance-requests": { scope: "portal.admin.maintenance_requests", maxAttempts: 60, windowSeconds: 900 },
    "/portal/admin/api/multi-client": { scope: "portal.admin.multi_client", maxAttempts: 40, windowSeconds: 900 }
  };

  return configs[pathname] || { scope: `portal.write.${pathname.replaceAll("/", ".")}`.slice(0, 80), maxAttempts: 20, windowSeconds: 900 };
}

// 1. Core setup and AB testing
const setupMiddleware: MiddlewareHandler = async (context, next) => {
  const nonce = createCspNonce();
  context.locals.nonce = nonce;

  const variantCookie = context.cookies.get("kharon_ui_variant")?.value;
  let variant = variantCookie || (Math.random() < 0.5 ? "A" : "B");
  context.locals.variant = variant;
  
  context.locals.needsVariantCookie = !variantCookie;

  return await next();
};

// 2. Base Security
const securityMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const nonce = context.locals.nonce;

  if (pathContainsTraversal(pathname) && pathname.startsWith("/portal")) {
    return withSecurityHeaders(new Response("Invalid portal path.", { status: 400 }), nonce);
  }

  const response = await next();
  
  let finalResponse = response;
  if (!finalResponse.headers.has("X-Content-Type-Options")) {
      finalResponse = await withHtmlSecurityHeaders(finalResponse, nonce);
  }

  if (context.locals.needsVariantCookie) {
    finalResponse.headers.append(
      "Set-Cookie",
      `kharon_ui_variant=${context.locals.variant}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`
    );
  }
  
  if (context.locals.shouldSetCsrfCookie && context.locals.csrfToken) {
     finalResponse.headers.append("Set-Cookie", csrfCookie(context.locals.csrfToken));
  }

  return finalResponse;
};

// 3. Authentication
const authMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const nonce = context.locals.nonce;

  if (!pathname.startsWith("/portal")) return await next();
  if (pathname === loginPath || pathname === authApiPath || pathname === resetPath || pathname === resetApiPath) {
    return await next();
  }

  const db = getDatabase();
  const token = context.cookies.get(sessionCookieName)?.value;
  if (!token) return redirectToLogin(context, nonce);

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
  return await next();
};

// 4. CSRF and Rate Limiting
const csrfAndRateLimitMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const user = context.locals.user;
  const nonce = context.locals.nonce;
  
  if (!user || !pathname.startsWith("/portal")) return await next();

  let csrfToken: string | undefined = context.cookies.get(csrfCookieName)?.value;
  context.locals.shouldSetCsrfCookie = false;
  if (!(await verifyCsrfToken(csrfToken, user))) {
    csrfToken = await createCsrfToken(user);
    context.locals.shouldSetCsrfCookie = true;
  }
  context.locals.csrfToken = csrfToken as string;

  if (isStateChangingPortalApi(context.request, pathname)) {
    const db = getDatabase();
    if (!(await verifyCsrfRequest(context.request, user))) {
      await auditEvent(db, context.request, {
        eventType: "security.csrf",
        entityType: "session",
        entityId: user?.id || "unknown",
        outcome: "blocked",
        user: user,
        subject: user?.email || "unknown"
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
        entityType: "session",
        entityId: user?.id || "unknown",
        outcome: "blocked",
        metadata: { scope: config.scope, retryAfter: limit.retryAfter },
        user: user,
        subject: user?.email || "unknown"
      });
      return rateLimitResponse(limit.retryAfter, nonce);
    }
  }

  return await next();
};

// 5. RBAC and Forced Actions
const rbacMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const user = context.locals.user;
  const nonce = context.locals.nonce;

  if (!user || !pathname.startsWith("/portal")) return await next();
  if (pathname === loginPath || pathname === authApiPath || pathname === resetPath || pathname === resetApiPath) {
      return await next();
  }

  if (user.forcePasswordChange && pathname !== passwordPath && pathname !== passwordApiPath && pathname !== logoutApiPath) {
    return withSecurityHeaders(context.redirect(passwordPath, 302), nonce);
  }

  if (user.mfaRequired && !user.mfaEnabled && pathname !== mfaPath && pathname !== mfaApiPath && pathname !== logoutApiPath) {
    return withSecurityHeaders(context.redirect(mfaPath, 302), nonce);
  }

  if (pathname === portalRootPath || pathname === `${portalRootPath}/`) {
    return redirectToRoleDashboard(context, user.role, nonce);
  }

  if (!allowedForPath(pathname, user.role)) {
    return redirectToRoleDashboard(context, user.role, nonce);
  }

  return await next();
};

const middlewareChain = sequence(
  setupMiddleware,
  authMiddleware,
  csrfAndRateLimitMiddleware,
  rbacMiddleware,
  securityMiddleware
);

export const onRequest: MiddlewareHandler = async (context, next) => {
  try {
    return await middlewareChain(context, next);
  } catch (error) {
    console.error("Critical Middleware Error:", error);
    
    // Structured error for Cloudflare Logs/Tail
    const errorData = {
      timestamp: new Date().toISOString(),
      url: context.url.toString(),
      method: context.request.method,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      user: context.locals.user?.id || "anonymous"
    };
    
    console.error(JSON.stringify(errorData));

    return new Response("A critical system error occurred. Please contact admin@kharon.co.za if this persists.", { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
};
