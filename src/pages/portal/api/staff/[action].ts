import type { APIContext } from "astro";
import { getDatabase } from "../../../../lib/server/bindings";
import { auditEvent, auditError } from "../../../../lib/server/audit";
import { requireAdmin } from "../../../../lib/server/access";
import {
  badRequest,
  forbidden,
  json,
  methodNotAllowed,
  serverError,
  unauthorized,
} from "../../../../lib/server/http.ts";
import type { UpdateStaffMemberData } from "../../../../lib/server/db/staff-repository";
import {
  createStaffMember,
  updateStaffMember,
  softDeleteStaffMember,
} from "../../../../lib/server/db/staff-repository";

export const prerender = false;

const VALID_EMPLOYMENT_TYPES = new Set(["Full-time", "Part-time", "Contractor"]);
const VALID_STATUSES = new Set(["Active", "Inactive", "Terminated"]);

export async function POST({ params, request, locals }: APIContext): Promise<Response> {
  const user = locals.user;
  if (!user) return unauthorized();
  const adminError = requireAdmin(user);
  if (adminError) return adminError;

  const action = params.action ?? "";
  let db: ReturnType<typeof getDatabase> | undefined;

  try {
    db = getDatabase();
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return badRequest("Request body must be valid JSON.");
    }

    if (action === "create-member") {
      const full_name = String(body.full_name ?? "").trim();
      const role_title = String(body.role_title ?? "").trim();
      const employment_type = String(body.employment_type ?? "Full-time").trim();
      const status = String(body.status ?? "Active").trim();

      if (!full_name) return badRequest("Full name is required.");
      if (!role_title) return badRequest("Role title is required.");
      if (!VALID_EMPLOYMENT_TYPES.has(employment_type))
        return badRequest("Invalid employment type.");
      if (!VALID_STATUSES.has(status)) return badRequest("Invalid status.");

      const id = await createStaffMember(db, {
        full_name,
        role_title,
        email: body.email ? String(body.email).trim() : null,
        phone: body.phone ? String(body.phone).trim() : null,
        start_date: body.start_date ? String(body.start_date).trim() : null,
        employment_type,
        status,
        notes: body.notes ? String(body.notes).trim() : null,
      });

      await auditEvent(db, request, {
        eventType: "hr.staff_member_create",
        entityType: "staff_member",
        entityId: id,
        outcome: "success",
        user,
        metadata: { full_name, role_title },
      });

      return json({ ok: true, id, message: "Staff member created." });
    }

    if (action === "update-member") {
      const id = String(body.id ?? "").trim();
      if (!id) return badRequest("Staff member ID is required.");

      const update: UpdateStaffMemberData = {};
      if (body.full_name !== undefined) update.full_name = String(body.full_name).trim();
      if (body.role_title !== undefined) update.role_title = String(body.role_title).trim();
      if (body.email !== undefined) update.email = body.email ? String(body.email).trim() : null;
      if (body.phone !== undefined) update.phone = body.phone ? String(body.phone).trim() : null;
      if (body.start_date !== undefined)
        update.start_date = body.start_date ? String(body.start_date).trim() : null;
      if (body.employment_type !== undefined) {
        const et = String(body.employment_type).trim();
        if (!VALID_EMPLOYMENT_TYPES.has(et)) return badRequest("Invalid employment type.");
        update.employment_type = et;
      }
      if (body.status !== undefined) {
        const st = String(body.status).trim();
        if (!VALID_STATUSES.has(st)) return badRequest("Invalid status.");
        update.status = st;
      }
      if (body.notes !== undefined) update.notes = body.notes ? String(body.notes).trim() : null;

      await updateStaffMember(db, id, update);

      await auditEvent(db, request, {
        eventType: "hr.staff_member_update",
        entityType: "staff_member",
        entityId: id,
        outcome: "success",
        user,
        metadata: update as Record<string, unknown>,
      });

      return json({ ok: true, id, message: "Staff member updated." });
    }

    if (action === "delete-member") {
      const id = String(body.id ?? "").trim();
      if (!id) return badRequest("Staff member ID is required.");

      await softDeleteStaffMember(db, id);

      await auditEvent(db, request, {
        eventType: "hr.staff_member_delete",
        entityType: "staff_member",
        entityId: id,
        outcome: "success",
        user,
        metadata: {},
      });

      return json({ ok: true, message: "Staff member removed." });
    }

    return badRequest(`Unknown action: ${action}`);
  } catch (error) {
    if (db) {
      await auditError(db, request, error as Error, {
        user,
        metadata: { action },
      }).catch(() => {});
    }
    console.error("Staff action failed:", error);
    return serverError("Staff action could not be completed.");
  }
}

export function GET(): Response {
  return forbidden("Use POST for staff management actions.");
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
