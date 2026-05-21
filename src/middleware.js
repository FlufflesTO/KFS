import { defineMiddleware } from "astro/middleware";
import { sessionCookieName, verifySessionToken } from "./lib/server/auth.js";
import { createCsrfToken, csrfCookie, csrfCookieName, verifyCsrfToken } from "./lib/server/csrf.js";
import { getDatabase } from "./lib/server/bindings.js";
import { consumeRateLimit } from "./lib/server/rateLimit.js";

const loginPath = "/portal/login";
const authApiPath = "/portal/api/auth";
const logoutApiPath = "/portal/api/logout";
const passwordPath = "/portal/account/password";
const passwordApiPath = "/portal/api/change-password";
const portalRootPath = "/portal";

function redirectToLogin(context) {
  const loginUrl = new URL(loginPath, context.url);
  loginUrl.searchParams.set("next", context.url.pathname);
  return context.redirect(loginUrl.toString(), 302);
}

function redirectToRoleDashboard(context, role) {
  const destinations = {
    tech: "/portal/tech/dashboard",
    admin: "/portal/admin/dashboard",
    client: "/portal/client/dashboard",
    finance: "/portal/finance/dashboard"
  };

  return context.redirect(destinations[role] || loginPath, 302);
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

function csrfForbidden() {
  return new Response(JSON.stringify({ ok: false, error: "csrf_failed", message: "Request verification failed." }), {
    status: 403,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function rateLimitResponse(retryAfter) {
  return new Response(JSON.stringify({ ok: false, error: "rate_limited", message: "Too many portal write requests. Try again shortly.", retryAfter }), {
    status: 429,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(retryAfter)
    }
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (!pathname.startsWith("/portal")) {
    return next();
  }

  if (pathContainsTraversal(pathname)) {
    return new Response("Invalid portal path.", { status: 400 });
  }

  if (pathname === loginPath || pathname === authApiPath) {
    return next();
  }

  const token = context.cookies.get(sessionCookieName)?.value;
  if (!token) {
    return redirectToLogin(context);
  }

  const user = await verifySessionToken(token);
  if (!user) {
    const response = redirectToLogin(context);
    response.headers.append("Set-Cookie", `${sessionCookieName}=; Path=/portal; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
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
    const submittedToken = context.request.headers.get("x-csrf-token");
    if (!submittedToken || submittedToken !== csrfToken || !(await verifyCsrfToken(submittedToken, user))) {
      return csrfForbidden();
    }

    const limit = await consumeRateLimit(getDatabase(), context.request, {
      scope: `write:${pathname}`.slice(0, 80),
      subject: user.id,
      maxAttempts: 45,
      windowSeconds: 300
    });
    if (!limit.allowed) {
      return rateLimitResponse(limit.retryAfter);
    }
  }

  if (user.forcePasswordChange && pathname !== passwordPath && pathname !== passwordApiPath && pathname !== logoutApiPath) {
    const response = context.redirect(passwordPath, 302);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  if (pathname === portalRootPath || pathname === `${portalRootPath}/`) {
    const response = redirectToRoleDashboard(context, user.role);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  if (!allowedForPath(pathname, user.role)) {
    const response = redirectToRoleDashboard(context, user.role);
    if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
    return response;
  }

  const response = await next();
  if (shouldSetCsrfCookie) response.headers.append("Set-Cookie", csrfCookie(csrfToken));
  return response;
});
