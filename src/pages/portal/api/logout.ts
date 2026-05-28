import type { APIRoute } from "astro";
import { getDatabase } from "../../../lib/server/bindings";
import { auditEvent } from "../../../lib/server/audit";
import { expiredSessionCookie, revokeSessionToken, sessionCookieName } from "../../../lib/server/auth";
import { expiredCsrfCookie } from "../../../lib/server/csrf";
import { json, methodNotAllowed } from "../../../lib/server/http";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = getDatabase();
  const user = locals.user || null;

  const token = cookies.get(sessionCookieName)?.value;
  if (token) {
    await revokeSessionToken(db, token);
  }

  if (user) {
    await auditEvent(db, request, {
      eventType: "auth.logout",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user
    });
  }

  const response = json({ ok: true, redirectTo: "/portal/login" });
  response.headers.append("Set-Cookie", expiredSessionCookie());
  response.headers.append("Set-Cookie", expiredCsrfCookie());
  return response;
};

export const ALL: APIRoute = () => {
  return methodNotAllowed(["POST"]);
};
