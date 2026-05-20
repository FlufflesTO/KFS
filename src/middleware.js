import { defineMiddleware } from "astro/middleware";
import { sessionCookieName, verifySessionToken } from "./lib/server/auth.js";

const loginPath = "/portal/login";
const authApiPath = "/portal/api/auth";
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

  if (pathname === portalRootPath || pathname === `${portalRootPath}/`) {
    return redirectToRoleDashboard(context, user.role);
  }

  if (!allowedForPath(pathname, user.role)) {
    return redirectToRoleDashboard(context, user.role);
  }

  return next();
});
