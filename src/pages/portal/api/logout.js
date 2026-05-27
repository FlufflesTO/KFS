import { getDatabase } from "../../../lib/server/bindings.ts";
import { auditEvent } from "../../../lib/server/audit";
import { expiredSessionCookie, revokeSessionToken, sessionCookieName } from "../../../lib/server/auth.js";
import { expiredCsrfCookie } from "../../../lib/server/csrf.js";
import { json, methodNotAllowed } from "../../../lib/server/http.ts";

export const prerender = false;

export async function POST({ request, locals, cookies }) {
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
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
