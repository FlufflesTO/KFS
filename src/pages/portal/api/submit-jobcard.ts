/**
 * Project Sentinel - Jobcard Submission API
 * Purpose: Handles technician signature, evidence collection, and final job closure
 * Dependencies: ../../../lib/server/bindings.ts, ../../../lib/server/audit, ../../../lib/server/jobcardPdf, ../../../lib/server/http.ts, ../../../lib/server/services/finance-service
 * Structural Role: Mutating REST API endpoint for jobcard completion
 */

import { auditError, auditEvent } from "../../../lib/server/audit";
import { FinanceService } from "../../../lib/server/services/finance-service.js";
import { getBindings, getStandardServiceFee } from "../../../lib/server/bindings.js";
import { badRequest, forbidden, methodNotAllowed, serverError } from "../../../lib/server/http.js";
import { json } from "../../../lib/server/http.js";
import { verifyCsrfRequest } from "../../../lib/server/csrf.js";
import { JobCardSchema } from "../../../lib/validation/schemas";
import { buildJobcardPdf } from "../../../lib/server/jobcardPdf";
import { JobRepository } from "../../../lib/server/db/job-repository.js";
import { SystemRepository } from "../../../lib/server/db/system-repository.js";

export const prerender = false;

interface JobQueryResult {
  id: string;
  system_id: string;
  assigned_technician_id: string | null;
  status: string;
  scheduled_date: string;
  job_type: string;
  site_id: string;
  system_type: string;
  coverage_area: string;
  service_interval_months: number | null;
  owner_company_name: string;
  physical_address: string;
  existing_financial_record_id: string | null;
}

interface EvidencePhoto {
  bytes: Uint8Array;
  contentType: string;
  caption: string;
}

interface EvidenceRecord extends EvidencePhoto {
  id: string;
  storagePath: string;
  index: number;
}

interface DefectInput {
  severity: "Critical" | "Major" | "Minor" | "Observation";
  description: string;
  sansClauseRef: string;
  certificateBlocking: number;
}

function addMonths(date: Date, months: number): string {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next.toISOString().slice(0, 10);
}

function dataUriToBytes(dataUri: string): { bytes: Uint8Array; contentType: string } {
  const match = dataUri.match(/^data:(image\/(?:jpeg|png|webp));base64,(?<data>[A-Za-z0-9+/=]+)$/);
  if (!match?.groups?.data) {
    throw new Error("Invalid image format.");
  }
  const binary = atob(match.groups.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { bytes, contentType: match[1] || "image/jpeg" };
}

export async function POST({ request, locals }: APIContext): Promise<Response> {
  let jobId = "unknown";

  try {
    // Manual role check since requireRole doesn't exist
    if (!locals.user || !["admin", "tech", "client"].includes(locals.user.role)) {
      return forbidden("Insufficient permissions.");
    }

    const { db, storage } = getBindings();

    // Initialize repositories
    const jobRepository = new JobRepository(db);
    const systemRepository = new SystemRepository(db);

    // Verify CSRF token from header (JSON payload submission)
    const csrfValid = await verifyCsrfRequest(request, locals.user);
    if (!csrfValid) {
      return badRequest("Invalid CSRF token");
    }

    let payload: Record<string, any>;
    try {
      payload = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    const parsed = JobCardSchema.safeParse(payload);

    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Validation failed.");
    }

    const {
      jobId: rawJobId,
      systemId,
      techComments,
      signatureBase64,
      signatureStrokes,
      faultCategory,
      partsUsed,
      followUpActions,
      customerName,
      customerTitle,
      evidencePhotos: rawEvidencePhotos,
      defects: rawDefects
    } = parsed.data;

    jobId = rawJobId;

    const evidenceRecords: EvidenceRecord[] = rawEvidencePhotos.map((photo, index) => {
      const { bytes, contentType } = dataUriToBytes(photo.dataUri);
      const id = crypto.randomUUID();
      const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
      return {
        bytes,
        contentType,
        caption: photo.caption || `Evidence photo ${index + 1}`,
        id,
        storagePath: `job-evidence/job-${jobId}/${id}.${extension}`,
        index
      };
    });

    const defects: DefectInput[] = rawDefects.map(d => ({
      severity: d.severity,
      description: d.description,
      sansClauseRef: d.sansClauseRef || "",
      certificateBlocking: d.certificateBlocking ? 1 : 0
    }));

    // Use JobRepository to fetch job with related data
    const job = await db
      .prepare(
        `SELECT jobs.id, jobs.system_id, jobs.assigned_technician_id, jobs.status, jobs.scheduled_date, jobs.job_type,
                systems.site_id, systems.system_type, systems.coverage_area,
                systems.service_interval_months,
                sites.owner_company_name, sites.physical_address,
                existing_finance.id AS existing_financial_record_id
         FROM jobs
         INNER JOIN systems ON systems.id = jobs.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         LEFT JOIN financial_records AS existing_finance
           ON existing_finance.job_id = jobs.id
          AND existing_finance.item_type = 'Invoice'
          AND existing_finance.payment_status IN ('Pending Approval', 'Unpaid', 'Settled')
         WHERE jobs.deleted_at IS NULL AND systems.deleted_at IS NULL
           AND jobs.id = ?1 AND jobs.system_id = ?2
         LIMIT 1`
      )
      .bind(jobId, systemId)
      .first<JobQueryResult>() ?? null;

    if (!job) {
      await auditEvent(db, request, {
        eventType: "jobcard.close",
        entityType: "job",
        entityId: jobId,
        outcome: "failure",
        user: locals.user,
        subject: locals.user?.email || "unknown",
        metadata: { reason: "missing_job_system", systemId }
      });
      return badRequest("The requested job and system mapping was not found.");
    }

    if (job.assigned_technician_id !== locals.user.id) {
      await auditEvent(db, request, {
        eventType: "jobcard.close",
        entityType: "job",
        entityId: jobId,
        outcome: "blocked",
        user: locals.user,
        subject: locals.user?.email || "unknown",
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
        user: locals.user,
        subject: locals.user?.email || "unknown",
        metadata: { reason: "invalid_status", currentStatus: job.status }
      });
      return badRequest("Only scheduled or in-progress jobs can be closed.");
    }

    // Verify system exists using repository (soft-delete aware)
    const system = await systemRepository.findById(systemId);
    if (!system) {
      await auditEvent(db, request, {
        eventType: "jobcard.close",
        entityType: "system",
        entityId: systemId,
        outcome: "failure",
        user: locals.user,
        subject: locals.user?.email || "unknown",
        metadata: { reason: "system_not_found_or_deleted" }
      });
      return badRequest("The associated system was not found or has been deleted.");
    }

    const completedAt = new Date();
    const serviceIntervalMonths = typeof job.service_interval_months === "number" && Number.isInteger(job.service_interval_months) && job.service_interval_months >= 1 ? job.service_interval_months : 6;
    const nextDueDate = addMonths(completedAt, serviceIntervalMonths);
    const documentationPath = `jobcards/job-${jobId}-completed.pdf`;
    const financialRecordId = job.existing_financial_record_id || crypto.randomUUID();
    const amount = getStandardServiceFee();

    const { pdfBytes, signatureHash } = (await buildJobcardPdf({
      jobId,
      systemId,
      technician: locals.user,
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
        followUpActions,
        customerName,
        customerTitle
      }
    })) as { pdfBytes: Uint8Array; signatureHash: string };

    await storage.put(documentationPath, pdfBytes, {
      httpMetadata: {
        contentType: "application/pdf",
        contentDisposition: `inline; filename="job-${jobId}-completed.pdf"`
      },
      customMetadata: {
        jobId,
        systemId,
        technicianId: locals.user.id,
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
          technicianId: locals.user.id,
          evidenceType: "Photo",
          completedAt: completedAt.toISOString()
        }
      });
    }

    // Create finance task for invoice
    const financeService = new FinanceService(db);
    await financeService.createInvoiceRequired(
      job.site_id,
      jobId,
      amount,
      `Invoice required for job ${jobId} completion`
    );

    const batchStatements = [
      db.prepare(
        `UPDATE jobs SET
           status = 'Completed',
           completed_at = CURRENT_TIMESTAMP,
           tech_comments = ?1,
           signature_base64 = ?2,
           signature_strokes = ?3,
           fault_category = ?4,
           parts_used = ?5,
           follow_up_actions = ?6,
           customer_name = ?7,
           customer_title = ?8,
           documentation_path = ?9,
           next_due_date = ?10,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?11`
      ).bind(
        techComments,
        signatureBase64,
        JSON.stringify(signatureStrokes),
        faultCategory,
        partsUsed,
        followUpActions,
        customerName,
        customerTitle,
        documentationPath,
        nextDueDate,
        jobId
      )
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
          .bind(evidence.id, jobId, systemId, locals.user?.id, evidence.storagePath, evidence.contentType, evidence.bytes.length, evidence.caption)
      );
    }

    for (const defect of defects) {
      const defectId = crypto.randomUUID();
      batchStatements.push(
        db
          .prepare(
            `INSERT INTO defects
               (id, system_id, job_id, severity, sans_clause_ref, description, certificate_blocking, status)
             VALUES
               (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'Open')`
          )
          .bind(defectId, systemId, jobId, defect.severity, defect.sansClauseRef || null, defect.description, defect.certificateBlocking)
      );
    }

    await db.batch(batchStatements);

    if (!job.existing_financial_record_id) {
      const hasBlockingDefects = defects.some((d) => d.certificateBlocking === 1);
      await auditEvent(db, request, {
        eventType: "finance.record.create",
        entityType: "financial_record",
        entityId: financialRecordId,
        outcome: "success",
        user: locals.user,
        subject: locals.user?.email || "unknown",
        metadata: {
          itemType: "Task",
          siteId: job.site_id,
          jobId,
          amountExVat: null,
          vatAmount: null,
          amountIncVat: amount,
          paymentStatus: "Pending",
          reference: hasBlockingDefects ? `Sage quote required for defect remediation on job ${jobId}` : `Sage invoice required for completed job ${jobId}`,
          financeTaskStatus: hasBlockingDefects ? "Quote Required" : "Invoice Required"
        }
      });
    }

    await auditEvent(db, request, {
      eventType: "jobcard.close",
      entityType: "job",
      entityId: jobId,
      outcome: "success",
      user: locals.user,
      subject: locals.user?.email || "unknown",
      metadata: {
        systemId,
        documentationPath,
        nextDueDate,
        financialRecordId,
        faultCategory,
        partsUsed,
        followUpActions,
        customerName,
        evidenceCount: evidenceRecords.length,
        defectCount: defects.length
      }
    });

    return json({
      ok: true,
      success: true,
      jobId,
      message: "Job card submitted successfully. An invoice task has been created for the finance team to process in Sage."
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Request body must be valid JSON.");
    }

    const err = error as Error;
    const db = getDatabase();
    if (db) {
      await auditError(db, request, err, {
        entityType: "jobcard_submission",
        entityId: jobId || "unknown"
      });
    }
    return serverError("The jobcard could not be submitted.");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["POST"]);
}
