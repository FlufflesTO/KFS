import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanChoice, cleanDate, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const statuses = ["Scheduled", "In Progress", "Completed", "Invoiced"];
const slaPriorities = ["Critical", "High", "Normal", "Low"];
const unableToCompleteCategories = ["Access Denied", "Equipment Not Available", "Site Unsafe", "Customer Request", "Weather Conditions", "Other"];

export async function POST({ request, locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();

  try {
    const body = await readJson(request);
    const action = String(body.action || "create");

    if (action === "markInvoiced") {
      const id = cleanId(body.id, "id");
      const job = await db
        .prepare(`SELECT id, status FROM jobs WHERE id = ?1 LIMIT 1`)
        .bind(id)
        .first();
      if (!job) return badRequest("Job not found.");
      if (job.status !== "Completed") return badRequest("Only Completed jobs can be marked as Invoiced.");
      await db.prepare(`UPDATE jobs SET status = 'Invoiced' WHERE id = ?1`).bind(id).run();
      await auditEvent(db, request, {
        eventType: "admin.job.markInvoiced",
        entityType: "job",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { status: "Invoiced" }
      });
      return json({ ok: true, id, status: "Invoiced" });
    }

    const id = action === "create" ? crypto.randomUUID() : cleanId(body.id, "id");
    const systemId = cleanId(body.systemId, "systemId");
    const assignedTechnicianId = cleanId(body.assignedTechnicianId, "assignedTechnicianId", { required: false });
    const scheduledDate = cleanDate(body.scheduledDate, "scheduledDate");
    const status = cleanChoice(body.status || "Scheduled", "status", statuses);
    const jobType = cleanText(body.jobType || "Maintenance", "jobType", { min: 2, max: 80 });
    const siteNotes = cleanText(body.siteNotes, "siteNotes", { required: false, max: 1000 });
    
    // Phase 22: Technician field enhancements
    const customerSiteContact = cleanText(body.customerSiteContact, "customerSiteContact", { required: false, max: 120 });
    const customerSitePhone = cleanText(body.customerSitePhone, "customerSitePhone", { required: false, max: 40 });
    const unableToComplete = body.unableToComplete === true ? 1 : 0;
    const unableToCompleteReason = cleanText(body.unableToCompleteReason, "unableToCompleteReason", { required: false, max: 1000 });
    const unableToCompleteCategory = body.unableToCompleteCategory 
      ? cleanChoice(body.unableToCompleteCategory, "unableToCompleteCategory", unableToCompleteCategories)
      : null;
    const rescheduleRequired = body.rescheduleRequired === true ? 1 : 0;
    
    // Phase 23: Admin dispatch board enhancements
    const slaPriority = body.slaPriority 
      ? cleanChoice(body.slaPriority, "slaPriority", slaPriorities)
      : "Normal";
    const slaDueDate = body.slaDueDate ? cleanDate(body.slaDueDate, "slaDueDate") : null;
    const dispatchBoardOrder = Number.isInteger(body.dispatchBoardOrder) ? body.dispatchBoardOrder : 0;

    if (action === "create") {
      await db
        .prepare(
          `INSERT INTO jobs
             (id, system_id, assigned_technician_id, scheduled_date, status, job_type, site_notes,
              customer_site_contact, customer_site_phone,
              unable_to_complete, unable_to_complete_reason, unable_to_complete_category, reschedule_required,
              sla_priority, sla_due_date, dispatch_board_order)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`
        )
        .bind(id, systemId, assignedTechnicianId, scheduledDate, status, jobType, siteNotes,
              customerSiteContact, customerSitePhone,
              unableToComplete, unableToCompleteReason, unableToCompleteCategory, rescheduleRequired,
              slaPriority, slaDueDate, dispatchBoardOrder)
        .run();
    } else if (action === "update") {
      await db
        .prepare(
          `UPDATE jobs
           SET system_id = ?1,
               assigned_technician_id = ?2,
               scheduled_date = ?3,
               status = ?4,
               job_type = ?5,
               site_notes = ?6,
               customer_site_contact = ?7,
               customer_site_phone = ?8,
               unable_to_complete = ?9,
               unable_to_complete_reason = ?10,
               unable_to_complete_category = ?11,
               reschedule_required = ?12,
               sla_priority = ?13,
               sla_due_date = ?14,
               dispatch_board_order = ?15
           WHERE id = ?16`
        )
        .bind(systemId, assignedTechnicianId, scheduledDate, status, jobType, siteNotes,
              customerSiteContact, customerSitePhone,
              unableToComplete, unableToCompleteReason, unableToCompleteCategory, rescheduleRequired,
              slaPriority, slaDueDate, dispatchBoardOrder, id)
        .run();
    } else {
      return badRequest("action is invalid.");
    }

    await auditEvent(db, request, {
      eventType: `admin.job.${action}`,
      entityType: "job",
      entityId: id,
      outcome: "success",
      user: locals.user,
      metadata: { systemId, assignedTechnicianId, status, slaPriority, unableToComplete }
    });

    return json({ ok: true, id });
  } catch (error) {
    if (error.message) return badRequest(error.message);
    console.error("admin jobs failed", error);
    return serverError("Job administration failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
