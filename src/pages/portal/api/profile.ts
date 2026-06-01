import type { APIRoute } from "astro";
import { auditError, auditEvent } from "../../../lib/server/audit";
import { cleanChoice, cleanEmail, cleanText, readJson } from "../../../lib/server/access";
import { getDatabase } from "../../../lib/server/bindings";
import { StaffRepository } from "../../../lib/server/db/staff-repository";
import { json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http";

export const prerender = false;

function optionalText(value: unknown, fieldName: string, max: number): string | null {
  const cleaned = cleanText(value, fieldName, { min: 0, max, required: false });
  return cleaned || null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  const db = getDatabase();
  try {
    const body = await readJson(request);
    const notificationEmail = cleanEmail(body.notificationEmail, "notificationEmail", { required: false });
    const portalDensity = cleanChoice(body.portalDensity || "comfortable", "portalDensity", ["compact", "comfortable"]) as "compact" | "comfortable";

    const repo = new StaffRepository(db);
    await repo.upsertProfile(user.id, {
      preferredName: optionalText(body.preferredName, "preferredName", 80),
      phone: optionalText(body.phone, "phone", 40),
      jobTitle: optionalText(body.jobTitle, "jobTitle", 120),
      emergencyContactName: optionalText(body.emergencyContactName, "emergencyContactName", 120),
      emergencyContactPhone: optionalText(body.emergencyContactPhone, "emergencyContactPhone", 40),
      notificationEmail,
      portalDensity
    });

    await auditEvent(db, request, {
      eventType: "account.profile_update",
      entityType: "user_profile",
      entityId: user.id,
      outcome: "success",
      user
    });

    return json({ ok: true, message: "Profile saved." });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return json({ ok: false, error: "bad_request", message: error.message }, { status: 400 });
    }
    await auditError(db, request, error as Error, { user, entityType: "user_profile", entityId: user.id });
    return serverError("Profile could not be saved.");
  }
};

export const ALL: APIRoute = () => methodNotAllowed(["POST"]);
