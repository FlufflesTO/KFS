import { getBindings, getStandardServiceFee } from "../../../lib/server/bindings.js";
import { buildJobcardPdf } from "../../../lib/server/jobcardPdf.js";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../lib/server/http.js";

export const prerender = false;

function cleanId(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(normalized)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return normalized;
}

function addMonths(date, months) {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

export async function POST({ request, locals }) {
  try {
    const user = locals.user;
    if (!user) return unauthorized();
    if (user.role !== "tech") return forbidden("Only technician accounts can close field jobcards.");

    const payload = await request.json();
    const jobId = cleanId(payload.jobId, "jobId");
    const systemId = cleanId(payload.systemId, "systemId");
    const techComments = String(payload.techComments || "").trim();
    const signatureBase64 = String(payload.signatureBase64 || "");

    if (techComments.length < 3 || techComments.length > 3000) {
      return badRequest("Technician comments must be between 3 and 3000 characters.");
    }

    if (!signatureBase64) {
      return badRequest("A captured signature is required.");
    }

    const { db, storage } = getBindings();
    const job = await db
      .prepare(
        `SELECT jobs.id, jobs.system_id, jobs.assigned_technician_id, jobs.status, systems.site_id
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         WHERE jobs.id = ?1 AND jobs.system_id = ?2
         LIMIT 1`
      )
      .bind(jobId, systemId)
      .first();

    if (!job) {
      return badRequest("The requested job and system mapping was not found.");
    }

    if (job.assigned_technician_id !== user.id) {
      return forbidden("This job is not assigned to the authenticated technician.");
    }

    if (!["Scheduled", "In Progress"].includes(job.status)) {
      return badRequest("Only scheduled or in-progress jobs can be closed.", { currentStatus: job.status });
    }

    const completedAt = new Date();
    const serviceDate = completedAt.toISOString().slice(0, 10);
    const nextDueDate = addMonths(completedAt, 6);
    const documentationPath = `jobcards/job-${jobId}-completed.pdf`;
    const financialRecordId = crypto.randomUUID();
    const amount = getStandardServiceFee();

    const { pdfBytes, signatureHash } = await buildJobcardPdf({
      jobId,
      systemId,
      technician: user,
      techComments,
      signatureBase64,
      completedAt: completedAt.toISOString()
    });

    await storage.put(documentationPath, pdfBytes, {
      httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: `inline; filename="job-${jobId}-completed.pdf"`
      },
      customMetadata: {
        jobId,
        systemId,
        technicianId: user.id,
        signatureSha256: signatureHash,
        completedAt: completedAt.toISOString()
      }
    });

    await db.batch([
      db
        .prepare(
          `UPDATE jobs
           SET status = 'Completed',
               tech_comments = ?1,
               documentation_path = ?2,
               completed_at = ?3
           WHERE id = ?4 AND system_id = ?5`
        )
        .bind(techComments, documentationPath, completedAt.toISOString(), jobId, systemId),
      db
        .prepare(
          `UPDATE systems
           SET last_service_date = ?1,
               last_checked_at = ?2,
               next_due_date = ?3
           WHERE id = ?4`
        )
        .bind(serviceDate, completedAt.toISOString(), nextDueDate, systemId),
      db
        .prepare(
          `INSERT INTO financial_records
             (id, site_id, job_id, amount, item_type, payment_status, distribution_date, reference)
           VALUES
             (?1, ?2, ?3, ?4, 'Invoice', 'Unpaid', ?5, ?6)`
        )
        .bind(financialRecordId, job.site_id, jobId, amount, serviceDate, `Standard service invoice for job ${jobId}`)
    ]);

    return json({
      ok: true,
      jobId,
      systemId,
      status: "Completed",
      documentationPath,
      nextDueDate,
      financialRecordId
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    console.error("submit jobcard failed", error);
    return serverError("The jobcard could not be submitted.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
