
import { getDatabase } from "../../../lib/server/bindings.ts";
import { auditEvent } from "../../../lib/server/audit";
import { badRequest, json, methodNotAllowed, serverError } from "../../../lib/server/http.ts";

export const prerender = false;

export async function POST({ request, locals, cookies }: import('astro').APIContext) {
  if (!locals.user) return json({ ok: false, message: "Unauthorized" }, { status: 401 });

  const db = getDatabase();

  try {
    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    const { category, message } = body;
    const { pathname } = new URL(request.url);
    const variant = cookies.get("kharon_ui_variant")?.value || "unknown";

    if (!category || !message) {
      return badRequest("Category and message are required.");
    }

    const id = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO user_feedback (id, user_id, variant, page_path, category, message)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, locals.user.id, variant, body.path || pathname, category, message).run();

    await auditEvent(db, request, {
      eventType: "user.feedback.submitted",
      entityType: "feedback",
      entityId: id,
      outcome: "success",
      user: locals.user,
      metadata: { category, variant }
    });

    return json({ ok: true, message: "Feedback submitted successfully." });
  } catch (error: any) {
    console.error("Feedback submission error:", error);
    return serverError("Failed to submit feedback.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}

