import { getDatabase } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../lib/server/http.js";
import { cleanChoice, cleanDate, cleanId, cleanText, readJson, requireAdmin } from "../../../../lib/server/admin.js";

export const prerender = false;

const statuses = ["Scheduled", "In Progress", "Completed", "Invoiced"];

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
        .prepare(
          `SELECT jobs.id, jobs.status, systems.site_id
           FROM jobs
           INNER JOIN systems ON systems.id = jobs.system_id
           WHERE jobs.id = ?1
           LIMIT 1`
        )
        .bind(id)
        .first();
      if (!job) return badRequest("Job not found.");
      if (job.status !== "Completed") return badRequest("Only Completed jobs can be marked as Invoiced.");

      const existingFinance = await db
        .prepare(`SELECT id FROM financial_records WHERE job_id = ?1 AND item_type = 'Invoice' LIMIT 1`)
        .bind(id)
        .first();

      const statements = [
        db.prepare(`UPDATE jobs SET status = 'Invoiced' WHERE id = ?1`).bind(id)
      ];

      if (existingFinance) {
        statements.push(
          db
            .prepare(
              `UPDATE financial_records
               SET finance_task_status = 'Sage Invoice Created'
               WHERE id = ?1`
            )
            .bind(existingFinance.id)
        );
      } else {
        statements.push(
          db
            .prepare(
              `INSERT INTO financial_records
                 (id, site_id, job_id, amount, item_type, payment_status, distribution_date, reference, finance_task_status)
               VALUES
                 (?1, ?2, ?3, 0, 'Invoice', 'Unpaid', date('now'), ?4, 'Sage Invoice Created')`
            )
            .bind(crypto.randomUUID(), job.site_id, id, `Sage invoice raised for completed job ${id}`)
        );
      }

      await db.batch(statements);
      await auditEvent(db, request, {
        eventType: "admin.job.markInvoiced",
        entityType: "job",
        entityId: id,
        outcome: "success",
        user: locals.user,
        metadata: { status: "Invoiced", financeTaskStatus: "Sage Invoice Created" }
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

    if (action === "create") {
      await db
        .prepare(
          `INSERT INTO jobs
             (id, system_id, assigned_technician_id, scheduled_date, status, job_type, site_notes)
           VALUES
             (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
        )
        .bind(id, systemId, assignedTechnicianId, scheduledDate, status, jobType, siteNotes)
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
               site_notes = ?6
           WHERE id = ?7`
        )
        .bind(systemId, assignedTechnicianId, scheduledDate, status, jobType, siteNotes, id)
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
      metadata: { systemId, assignedTechnicianId, status }
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
