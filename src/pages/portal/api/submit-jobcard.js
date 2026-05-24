import { getBindings, getStandardServiceFee } from "../../../lib/server/bindings.js";
import { auditEvent } from "../../../lib/server/audit.js";
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

function imageDataUriToEvidence(value, index) {
  const dataUri = String(value?.dataUri || "");
  const caption = String(value?.caption || `Evidence photo ${index + 1}`).trim().slice(0, 160);
  const match = dataUri.match(/^data:(image\/(?:jpeg|png|webp));base64,(?<data>[A-Za-z0-9+/=]+)$/);
  if (!match?.groups?.data) {
    throw new Error(`Evidence photo ${index + 1} must be a JPEG, PNG or WebP image.`);
  }

  const binary = atob(match.groups.data);
  const bytes = new Uint8Array(binary.length);
  for (let byteIndex = 0; byteIndex < binary.length; byteIndex += 1) bytes[byteIndex] = binary.charCodeAt(byteIndex);

  if (bytes.length < 128 || bytes.length > 1572864) {
    throw new Error(`Evidence photo ${index + 1} must be between 128 bytes and 1.5 MB.`);
  }

  return {
    bytes,
    contentType: match[1],
    caption
  };
}

function normalizeEvidencePhotos(value) {
  if (!Array.isArray(value)) return [];
  if (value.length > 3) throw new Error("A maximum of 3 evidence photos can be submitted per jobcard.");
  return value.map(imageDataUriToEvidence);
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
    const signatureStrokes = Array.isArray(payload.signatureStrokes) ? payload.signatureStrokes : [];
    const faultCategory = String(payload.faultCategory || "Routine service").trim().slice(0, 120);
    const partsUsed = String(payload.partsUsed || "None recorded").trim().slice(0, 500);
    const followUpActions = String(payload.followUpActions || "No follow-up actions recorded").trim().slice(0, 1000);
    const evidencePhotos = normalizeEvidencePhotos(payload.evidencePhotos);

    if (techComments.length < 3 || techComments.length > 3000) {
      return badRequest("Technician comments must be between 3 and 3000 characters.");
    }

    if (!signatureBase64) {
      return badRequest("A captured signature is required.");
    }

    const { db, storage } = getBindings();
    const job = await db
      .prepare(
        `SELECT jobs.id, jobs.system_id, jobs.assigned_technician_id, jobs.status, jobs.scheduled_date, jobs.job_type,
                systems.site_id, systems.system_type, systems.coverage_area,
                systems.service_interval_months,
                sites.owner_company_name, sites.physical_address
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         WHERE jobs.id = ?1 AND jobs.system_id = ?2
         LIMIT 1`
      )
      .bind(jobId, systemId)
      .first();

    if (!job) {
      await auditEvent(db, request, {
        eventType: "jobcard.close",
        entityType: "job",
        entityId: jobId,
        outcome: "failure",
        user,
        metadata: { reason: "missing_job_system", systemId }
      });
      return badRequest("The requested job and system mapping was not found.");
    }

    if (job.assigned_technician_id !== user.id) {
      await auditEvent(db, request, {
        eventType: "jobcard.close",
        entityType: "job",
        entityId: jobId,
        outcome: "blocked",
        user,
        metadata: { reason: "wrong_technician", assignedTechnicianId: job.assigned_technician_id }
      });
      return forbidden("This job is not assigned to the authenticated technician.");
    }

    if (!["Scheduled", "In Progress"].includes(job.status)) {
      await auditEvent(db, request, {
        eventType: "jobcard.close",
        entityType: "job",
        entityId: jobId,
        outcome: "failure",
        user,
        metadata: { reason: "invalid_status", currentStatus: job.status }
      });
      return badRequest("Only scheduled or in-progress jobs can be closed.", { currentStatus: job.status });
    }

    const completedAt = new Date();
    const serviceDate = completedAt.toISOString().slice(0, 10);
    const serviceIntervalMonths = Number.isInteger(job.service_interval_months) && job.service_interval_months >= 1 ? job.service_interval_months : 6;
    const nextDueDate = addMonths(completedAt, serviceIntervalMonths);
    const documentationPath = `jobcards/job-${jobId}-completed.pdf`;
    const financialRecordId = crypto.randomUUID();
    const amount = getStandardServiceFee();
    const evidenceRecords = evidencePhotos.map((photo, index) => {
      const id = crypto.randomUUID();
      const extension = photo.contentType === "image/png" ? "png" : photo.contentType === "image/webp" ? "webp" : "jpg";
      return {
        ...photo,
        id,
        storagePath: `job-evidence/job-${jobId}/${id}.${extension}`,
        index
      };
    });

    const { pdfBytes, signatureHash } = await buildJobcardPdf({
      jobId,
      systemId,
      technician: user,
      techComments,
      signatureBase64,
      signatureStrokes,
      completedAt: completedAt.toISOString(),
      evidence: {
        ownerCompanyName: job.owner_company_name,
        physicalAddress: job.physical_address,
        systemType: job.system_type,
        coverageArea: job.coverage_area,
        scheduledDate: job.scheduled_date,
        jobType: job.job_type,
        faultCategory,
        partsUsed,
        followUpActions
      }
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
        completedAt: completedAt.toISOString(),
        faultCategory
      }
    });

    for (const evidence of evidenceRecords) {
      await storage.put(evidence.storagePath, evidence.bytes, {
        httpMetadata: {
          contentType: evidence.contentType,
          contentDisposition: `inline; filename="job-${jobId}-evidence-${evidence.index + 1}"`
        },
        customMetadata: {
          jobId,
          systemId,
          technicianId: user.id,
          evidenceType: "Photo",
          completedAt: completedAt.toISOString()
        }
      });
    }

    const batchStatements = [
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
    ];

    for (const evidence of evidenceRecords) {
      batchStatements.push(
        db
          .prepare(
            `INSERT INTO job_evidence_files
               (id, job_id, system_id, uploaded_by_user_id, evidence_type, storage_path, content_type, file_size_bytes, caption)
             VALUES
               (?1, ?2, ?3, ?4, 'Photo', ?5, ?6, ?7, ?8)`
          )
          .bind(evidence.id, jobId, systemId, user.id, evidence.storagePath, evidence.contentType, evidence.bytes.length, evidence.caption)
      );
    }

    await db.batch(batchStatements);

    await auditEvent(db, request, {
      eventType: "jobcard.close",
      entityType: "job",
      entityId: jobId,
      outcome: "success",
      user,
      metadata: {
        systemId,
        documentationPath,
        nextDueDate,
        financialRecordId,
        faultCategory,
        partsUsed,
        followUpActions,
        evidenceCount: evidenceRecords.length
      }
    });

    return json({
      ok: true,
      jobId,
      systemId,
      status: "Completed",
      documentationPath,
      evidencePaths: evidenceRecords.map((record) => record.storagePath),
      nextDueDate,
      financialRecordId
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    if (error.message) {
      return badRequest(error.message);
    }

    console.error("submit jobcard failed", error);
    return serverError("The jobcard could not be submitted.");
  }
}

export function ALL() {
  return methodNotAllowed(["POST"]);
}
