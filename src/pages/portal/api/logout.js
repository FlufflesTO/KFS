import { getDatabase } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
import { expiredSessionCookie } from "../../../lib/server/auth.js";
import { json, methodNotAllowed } from "../../../lib/server/http.js";

export const prerender = false;

export async function POST({ request, locals }) {
  const db = getDatabase();
  const user = locals.user || null;

  if (user) {
    await auditEvent(db, request, {
      eventType: "auth.logout",
      entityType: "user",
      entityId: user.id,
      outcome: "success",
      user
    });
  }

  return json(
    { ok: true, redirectTo: "/portal/login" },
    {
      headers: {
        "Set-Cookie": expiredSessionCookie()
      }
    }
  );
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
