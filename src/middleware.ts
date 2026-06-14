/**
 * Project Sentinel - Portal Middleware
 * Purpose: Enforces security headers, session verification, rate limits, and CSRF protection across all /portal paths
 * Dependencies: astro:middleware plus portal-only dynamic imports for auth, csrf, bindings, rate limits, and audit.
 * Structural Role: Central request interception and security enforcement layer
 */

// @ts-ignore - defineMiddleware is used implicitly through MiddlewareHandler type
import { sequence } from "astro:middleware";
import type { MiddlewareHandler, APIContext } from "astro";
import type { SessionUser } from "./lib/server/auth.js";

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
const configuredPortalUrl = import.meta.env.PUBLIC_PORTAL_URL || "https://portal.tequit.co.za";
const portalOrigin = (() => {
  try {
    return new URL(configuredPortalUrl).origin;
  } catch {
    return "https://portal.tequit.co.za";
  }
})();
const portalHostname = new URL(portalOrigin).hostname.toLowerCase();

// Build-time flag: set to "website" only on the website Pages deploy (kfs-website),
// which has NO D1/R2/secret bindings. Wired in scripts/build-site.ps1 and CI.
const isWebsiteDeploy = import.meta.env.PUBLIC_DEPLOY_TARGET === "website";

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
      `default-src 'none'; script-src 'strict-dynamic' 'nonce-${nonce}' https://static.cloudflareinsights.com https://challenges.cloudflare.com https://plausible.io; script-src-attr 'none'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ${portalOrigin} https://cloudflareinsights.com https://plausible.io; frame-src https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' ${portalOrigin}; upgrade-insecure-requests; manifest-src 'self'`,
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

function redirectToLogin(context: APIContext, nonce: string = createCspNonce()): Response {
  const loginUrl = new URL(loginPath, context.url);
  loginUrl.searchParams.set("next", context.url.pathname);
  return withSecurityHeaders(context.redirect(loginUrl.toString(), 302), nonce);
}

function redirectToRoleDashboard(context: APIContext, role: string, nonce: string = createCspNonce()): Response {
  const destinations: Record<string, string> = {
    tech: "/portal/tech/dashboard",
    admin: "/portal/admin/dashboard",
    client: "/portal/client/dashboard",
    finance: "/portal/finance/dashboard",
    manager: "/portal/manager/dashboard"
  };

  return withSecurityHeaders(context.redirect(destinations[role] || loginPath, 302), nonce);
}

function allowedForPath(pathname: string, role: string): boolean {
  if (pathname.startsWith("/portal/account/")) return true;
  
  if (pathname.startsWith("/portal/api/tech/")) return role === "tech" || role === "admin";
  if (pathname.startsWith("/portal/api/staff/")) return role === "tech" || role === "admin" || role === "finance";
  if (pathname.startsWith("/portal/api/admin/")) return role === "admin"; // manager uses /portal/api/manager/ instead
  if (pathname.startsWith("/portal/api/finance/")) return role === "finance" || role === "admin";
  if (pathname.startsWith("/portal/api/client/")) return role === "client" || role === "admin";
  if (pathname.startsWith("/portal/api/manager/")) return role === "manager" || role === "admin";
  if (pathname.startsWith("/portal/api/")) {
    const sharedApiPaths = new Set([
      "/portal/api/logout",
      "/portal/api/profile",
      "/portal/api/change-password",
      "/portal/api/mfa",
      "/portal/api/feedback",
      "/portal/api/data-rights",
      "/portal/api/file",
      "/portal/api/maintenance-request",
      "/portal/api/approve-quote",
      "/portal/api/job-status",
      "/portal/api/job-visits",
      "/portal/api/submit-jobcard",
      "/portal/api/offline-sync"
    ]);
    return [...sharedApiPaths].some((path) => pathname === path || pathname.startsWith(`${path}/`));
  }

  if (pathname.startsWith("/portal/tech/")) return role === "tech" || role === "admin";
  if (pathname.startsWith("/portal/staff/")) return role === "tech" || role === "admin" || role === "finance" || role === "manager";
  if (pathname.startsWith("/portal/admin/")) {
    if (role === "admin") return true;
    if (role === "manager") {
      const managerAllowedAdminPaths = [
        "/portal/admin/dashboard",
        "/portal/admin/jobs",
        "/portal/admin/dispatch",
        "/portal/admin/sites",
        "/portal/admin/systems",
        "/portal/admin/planning",
        "/portal/admin/compliance",
        "/portal/admin/advanced-reporting",
      ];
      return managerAllowedAdminPaths.some(p => pathname === p || pathname.startsWith(`${p}/`));
    }
    return false;
  }
  if (pathname.startsWith("/portal/finance/")) return role === "finance" || role === "admin";
  if (pathname.startsWith("/portal/client/")) return role === "client" || role === "admin";
  if (pathname.startsWith("/portal/manager/")) return role === "manager" || role === "admin";
  
  return false;
}

// @ts-ignore
function pathContainsTraversal(pathname: string): boolean {
  try {
    const decodedPath = decodeURIComponent(pathname);
    return decodedPath.split("/").some((segment) => segment === ".." || segment === ".");
  } catch {
    return true;
  }
}

// @ts-ignore
function isStateChangingPortalApi(request: Request, pathname: string): boolean {
  return pathname.startsWith("/portal/api/")
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
    "/portal/api/profile": { scope: "portal.profile", maxAttempts: 20, windowSeconds: 900 },
    "/portal/api/staff/hr": { scope: "portal.staff.hr", maxAttempts: 20, windowSeconds: 900 },
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
    "/portal/api/admin/multi-client": { scope: "portal.admin.multi_client", maxAttempts: 40, windowSeconds: 900 }
  };

  return configs[pathname] || { scope: `portal.write.${pathname.replaceAll("/", ".")}`.slice(0, 80), maxAttempts: 20, windowSeconds: 900 };
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function hostnameFromHost(host: string): string {
  const trimmed = host.trim().toLowerCase();
  if (trimmed.startsWith("[")) {
    const closingBracket = trimmed.indexOf("]");
    return closingBracket > 0 ? trimmed.slice(1, closingBracket) : trimmed;
  }
  return trimmed.split(":")[0] || "";
}

function shouldRedirectToPortalHost(host: string, pathname: string): boolean {
  if (!pathname.startsWith("/portal")) return false;

  const hostname = hostnameFromHost(host);
  if (!hostname || isLocalHost(hostname)) return false;

  return hostname !== portalHostname;
}

function redirectToPortalHost(context: APIContext, nonce: string): Response {
  const target = new URL(`${context.url.pathname}${context.url.search}`, portalOrigin);
  const status = ["GET", "HEAD"].includes(context.request.method.toUpperCase()) ? 302 : 307;
  return withSecurityHeaders(context.redirect(target.toString(), status), nonce);
}

interface ActiveUserRow {
  id: string;
  name: string;
  email: string;
  role: "tech" | "admin" | "client" | "finance" | "manager";
  site_id: string | null;
  is_active: number;
  deleted_at: string | null;
  force_password_change: number;
  mfa_required: number;
  mfa_enabled: number;
  password_changed_at: string | null;
}

async function loadActiveSessionUser(db: D1Database, sessionUser: SessionUser): Promise<SessionUser | null> {
  const record = await db
    .prepare(
      `SELECT id, name, email, role, site_id, is_active, deleted_at, force_password_change, mfa_required, mfa_enabled, password_changed_at
       FROM users
       WHERE id = ?1 AND deleted_at IS NULL AND is_active = 1
       LIMIT 1`
    )
    .bind(sessionUser.id)
    .first<ActiveUserRow>();

  if (!record || !record.is_active || record.deleted_at) return null;

  // Invalidate any session minted before the user's last password change.
  // A password change/reset stamps password_changed_at; tokens issued earlier are no longer trusted.
  if (record.password_changed_at && typeof sessionUser.issuedAt === "number") {
    const changedAtSeconds = Math.floor(new Date(record.password_changed_at).getTime() / 1000);
    if (Number.isFinite(changedAtSeconds) && sessionUser.issuedAt < changedAtSeconds) {
      return null;
    }
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    site_id: record.site_id,
    siteId: record.site_id,
    force_password_change: Boolean(record.force_password_change),
    forcePasswordChange: Boolean(record.force_password_change),
    mfa_required: Boolean(record.mfa_required),
    mfaRequired: Boolean(record.mfa_required),
    mfa_enabled: Boolean(record.mfa_enabled),
    mfaEnabled: Boolean(record.mfa_enabled),
    expiresAt: sessionUser.expiresAt
  };
}

// 0. Website-deploy guard (runs FIRST in the chain).
// The website Pages project (kfs-website) ships the SAME built output but has NO
// D1/R2/secret bindings. Any /portal request reaching SSR here would crash on the
// first binding access. So on the website deploy we short-circuit every /portal
// request to the portal host BEFORE auth/db/secret access ever runs.
const websitePortalRedirectMiddleware: MiddlewareHandler = async (context, next) => {
  if (!isWebsiteDeploy) return await next();

  const { pathname, search } = context.url;
  const shouldRedirectPortalPath = pathname.startsWith("/portal");
  const shouldRedirectPublicApi =
    pathname === "/api/contact" ||
    pathname === "/api/data-request" ||
    pathname.startsWith("/api/finance/");
  if (!shouldRedirectPortalPath && !shouldRedirectPublicApi) return await next();

  // Loop guard: never redirect when we're already on the portal host (target === current).
  const currentHostname = hostnameFromHost(context.request.headers.get("host") ?? "");
  if (currentHostname && currentHostname === portalHostname) return await next();

  // Portal runtime lives on a different host than the marketing site.
  const target = new URL(`${pathname}${search}`, portalOrigin);
  return new Response(null, {
    status: shouldRedirectPortalPath ? 301 : 307,
    headers: { Location: target.toString(), "cache-control": "no-store" }
  });
};

// 1. Core setup and AB testing
const setupMiddleware: MiddlewareHandler = async (context, next) => {
  const host = context.request.headers.get("host") ?? "";
  const pathname = context.url.pathname;
  const nonce = createCspNonce();
  context.locals.nonce = nonce;

  if (shouldRedirectToPortalHost(host, pathname)) {
    return redirectToPortalHost(context, nonce);
  }

  if (hostnameFromHost(host) === portalHostname && (pathname === "/" || pathname === "")) {
    return withSecurityHeaders(context.redirect("/portal/login", 302), nonce);
  }

  let variantCookie: string | undefined;
  try {
    variantCookie = context.cookies.get("kharon_ui_variant")?.value;
  } catch (error) {
    console.error("Variant cookie decode error:", error);
  }
  let variant = variantCookie || (Math.random() < 0.5 ? "A" : "B");
  context.locals.variant = variant;

  context.locals.needsVariantCookie = !variantCookie;

  return await next();
};

// 2. Base Security
async function applySecurityMiddleware(
  context: APIContext,
  next: Parameters<MiddlewareHandler>[1],
  includePortalCsrfCookie: boolean
): Promise<Response> {
  const { pathname } = context.url;
  const nonce = context.locals.nonce;

  if (pathContainsTraversal(pathname) && pathname.startsWith("/portal")) {
    return withSecurityHeaders(new Response("Invalid portal path.", { status: 400 }), nonce);
  }

  const response = await next();
  
  let finalResponse = response;
  finalResponse = await withHtmlSecurityHeaders(finalResponse, nonce);

  if (context.locals.needsVariantCookie) {
    finalResponse.headers.append(
      "Set-Cookie",
      `kharon_ui_variant=${context.locals.variant}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`
    );
  }
  
  if (includePortalCsrfCookie && context.locals.shouldSetCsrfCookie && context.locals.csrfToken) {
     const { csrfCookie } = await import("./lib/server/csrf.js");
     finalResponse.headers.append("Set-Cookie", csrfCookie(context.locals.csrfToken));
  }

  return finalResponse;
}

const securityMiddleware: MiddlewareHandler = async (context, next) => {
  return applySecurityMiddleware(context, next, false);
};

const portalSecurityMiddleware: MiddlewareHandler = async (context, next) => {
  return applySecurityMiddleware(context, next, true);
};

// 3. Authentication
const authMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const nonce = context.locals.nonce;

  if (!pathname.startsWith("/portal")) return await next();
  if (pathname === loginPath || pathname === authApiPath || pathname === resetPath || pathname === resetApiPath) {
    return await next();
  }

  const { sessionCookieName, verifySessionToken, isTokenRevoked, expiredSessionCookie } = await import("./lib/server/auth.js");
  const { getDatabase } = await import("./lib/server/bindings.ts");

  let token: string | undefined;
  try {
    token = context.cookies.get(sessionCookieName)?.value;
  } catch (error) {
    // Prevent server crash from decodeURIComponent on malformed tokens
    console.error("Session cookie decode error:", error);
  }
  if (!token) return redirectToLogin(context, nonce);

  const user = await verifySessionToken(token);
  if (!user) {
    const response = redirectToLogin(context, nonce);
    response.headers.append("Set-Cookie", expiredSessionCookie());
    return response;
  }

  const db = getDatabase();
  if (await isTokenRevoked(db, token)) {
    const response = redirectToLogin(context, nonce);
    response.headers.append("Set-Cookie", expiredSessionCookie());
    return response;
  }

  const activeUser = await loadActiveSessionUser(db, user);
  if (!activeUser) {
    const response = redirectToLogin(context, nonce);
    response.headers.append("Set-Cookie", expiredSessionCookie());
    return response;
  }

  context.locals.user = activeUser;
  return await next();
};

// 3b. MFA Enforcement for API Endpoints
const mfaEnforcementMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const user = context.locals.user;
  const nonce = context.locals.nonce;

  // Only apply to authenticated users on portal API paths
  if (!user || !pathname.startsWith("/portal/api/")) return await next();

  // Exclude MFA setup and logout paths from enforcement
  if (pathname === mfaPath || pathname === mfaApiPath || pathname === logoutApiPath) {
    return await next();
  }

  // Check MFA enforcement requirement
  const isElevatedRole = ["admin", "finance"].includes(user.role);
  const mfaRequired = user.mfa_required === 1 || user.mfa_required === true || isElevatedRole;
  const mfaEnabled = user.mfa_enabled === 1 || user.mfa_enabled === true;

  if (mfaRequired && !mfaEnabled) {
    return withSecurityHeaders(new Response(JSON.stringify({
      ok: false,
      error: "mfa_required",
      message: "Multi-factor authentication setup is required before accessing this endpoint."
    }), {
      status: 403,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }), nonce);
  }

  return await next();
};

// 4. CSRF and Rate Limiting
const csrfAndRateLimitMiddleware: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;
  const user = context.locals.user;
  const nonce = context.locals.nonce;
  
  if (!user || !pathname.startsWith("/portal")) return await next();

  const { createCsrfToken, csrfCookieName, csrfErrorResponse, verifyCsrfRequest, verifyCsrfToken } = await import("./lib/server/csrf.js");
  const { getDatabase } = await import("./lib/server/bindings.ts");
  const { consumeRateLimit } = await import("./lib/server/rateLimit.js");
  const { auditEvent } = await import("./lib/server/audit");

  let csrfToken: string | undefined;
  try {
    csrfToken = context.cookies.get(csrfCookieName)?.value;
  } catch (error) {
    console.error("CSRF cookie decode error:", error);
  }
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

    const { isRateLimitRelaxedEnv } = await import("./lib/server/bindings-auth.ts");
    const config = rateLimitConfig(pathname);
    const limit = await consumeRateLimit(db, context.request, {
      scope: config.scope,
      subject: user.id,
      // E2E suites issue many same-user writes cumulatively; relax in CI/local only.
      maxAttempts: isRateLimitRelaxedEnv() ? 100000 : config.maxAttempts,
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

  const isElevatedRole = ["admin", "finance"].includes(user.role);
  const mfaRequired = user.mfaRequired || isElevatedRole;

  if (mfaRequired && !user.mfaEnabled && pathname !== mfaPath && pathname !== mfaApiPath && pathname !== logoutApiPath) {
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

const middlewareChain = isWebsiteDeploy
  ? sequence(
      websitePortalRedirectMiddleware,
      setupMiddleware,
      securityMiddleware
    )
  : sequence(
      websitePortalRedirectMiddleware,
      setupMiddleware,
      authMiddleware,
      mfaEnforcementMiddleware,
      csrfAndRateLimitMiddleware,
      rbacMiddleware,
      portalSecurityMiddleware
    );

export const onRequest: MiddlewareHandler = async (context, next) => {
  try {
    const response = await middlewareChain(context, next);
    if (response) {
      return response;
    }
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
  return next();
};
