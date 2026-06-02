import type { APIRoute } from "astro";
import { auditError, auditEvent } from "../../../../lib/server/audit";
import { cleanChoice, cleanDate, cleanInt, cleanText, readJson } from "../../../../lib/server/access";
import { getBindings, getDatabase } from "../../../../lib/server/bindings";
import { StaffRepository } from "../../../../lib/server/db/staff-repository";
import { badRequest, forbidden, json, methodNotAllowed, serverError, unauthorized } from "../../../../lib/server/http";
import type { StaffDocumentCategory, StaffLeaveType } from "@sentinel/types";

export const prerender = false;

const staffRoles = new Set(["admin", "finance", "tech"]);
const documentCategories = ["medical_certificate", "payslip", "contract", "training_certificate", "id_document", "other"];
const leaveTypes = ["annual", "sick", "family_responsibility", "unpaid"];
const allowedContentTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function requireStaff(user: App.Locals["user"]): Response | null {
  if (!user) return unauthorized();
  if (!staffRoles.has(user.role)) return forbidden("Only internal staff accounts can access HR records.");
  return null;
}

function safeFileName(name: string): string {
  const trimmed = name.trim().replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-");
  return trimmed.slice(0, 120) || "document";
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  const staffError = requireStaff(user);
  if (staffError) return staffError;

  const db = getDatabase();
  const repo = new StaffRepository(db);

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const action = cleanChoice(form.get("action") || "upload-document", "action", ["upload-document"]);
      const category = cleanChoice(form.get("category"), "category", documentCategories) as StaffDocumentCategory;
      const file = form.get("file");
      if (action !== "upload-document") return badRequest("Invalid HR document action.");
      if (!(file instanceof File)) return badRequest("A document file is required.");
      if (!allowedContentTypes.has(file.type)) return badRequest("Upload PDF, JPEG, PNG, or WebP files only.");
      if (file.size < 1 || file.size > 10 * 1024 * 1024) return badRequest("Document must be between 1 byte and 10MB.");

      const id = crypto.randomUUID();
      const fileName = safeFileName(file.name);
      const storagePath = `staff-vault/${user!.id}/${id}-${fileName}`;
      const { storage } = getBindings();
      await storage.put(storagePath, await file.arrayBuffer(), {
        httpMetadata: {
          contentType: file.type
        },
        customMetadata: {
          userId: user!.id,
          category
        }
      });

      await repo.createDocument({
        userId: user!.id,
        category,
        fileName,
        storagePath,
        contentType: file.type,
        sizeBytes: file.size,
        uploadedByUserId: user!.id
      });

      await auditEvent(db, request, {
        eventType: "staff.document_upload",
        entityType: "staff_document",
        entityId: storagePath,
        outcome: "success",
        user,
        metadata: { category, sizeBytes: file.size }
      });

      return json({ ok: true, message: "Document uploaded." });
    }

    const body = await readJson(request);
    const action = cleanChoice(body.action || "request-leave", "action", ["request-leave"]);
    if (action !== "request-leave") return badRequest("Invalid HR action.");

    const leaveType = cleanChoice(body.leaveType, "leaveType", leaveTypes) as StaffLeaveType;
    const startDate = cleanDate(body.startDate, "startDate");
    const endDate = cleanDate(body.endDate, "endDate");
    if (endDate < startDate) return badRequest("End date cannot be before start date.");

    const daysRequested = cleanInt(body.daysRequested, "daysRequested", { min: 1, max: 60 });
    const reason = cleanText(body.reason, "reason", { min: 0, max: 500, required: false }) || null;

    const leaveId = await repo.createLeaveRequest({
      userId: user!.id,
      leaveType,
      startDate,
      endDate,
      daysRequested,
      reason
    });

    await auditEvent(db, request, {
      eventType: "staff.leave_request",
      entityType: "staff_leave_request",
      entityId: leaveId,
      outcome: "success",
      user,
      metadata: { leaveType, startDate, endDate, daysRequested }
    });

    return json({ ok: true, id: leaveId, message: "Leave request submitted." });
  } catch (error) {
    if (error instanceof Error && error.message) return badRequest(error.message);
    await auditError(db, request, error as Error, { user, entityType: "staff_hr", entityId: user?.id });
    return serverError("HR request could not be completed.");
  }
};

export const ALL: APIRoute = () => methodNotAllowed(["POST"]);
