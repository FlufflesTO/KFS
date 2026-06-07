import type { APIContext } from "astro";
import { generateCertificatePDF } from "../../../../../../lib/pdf/certificate-generator";
import { auditEvent } from "../../../../../../lib/server/audit";
import { getDatabase } from "../../../../../../lib/server/bindings";
import { CertificateRepository } from "../../../../../../lib/server/db/certificate-repository";
import { badRequest, json, methodNotAllowed, serverError } from "../../../../../../lib/server/http";
import { cleanId, requireAdmin } from "../../../../../../lib/server/access";

export const prerender = false;

export async function GET({ params, request, locals }: APIContext) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const id = cleanId(params.id, "id");
  if (!id) return badRequest("Certificate id is required.");

  try {
    const db = getDatabase();
    const certificate = await new CertificateRepository(db).findPdfRecordById(id);
    if (!certificate) {
      return json({ ok: false, error: "not_found", message: "Certificate not found." }, { status: 404 });
    }

    const pdfBytes = await generateCertificatePDF({
      id: certificate.id,
      certificateType: certificate.certificate_type,
      issuedDate: certificate.issued_date,
      expiryDate: certificate.expiry_date || "",
      status: certificate.status,
      systemType: certificate.system_type,
      coverageArea: certificate.coverage_area,
      companyName: certificate.owner_company_name,
      technicianName: certificate.technician_name || "Authorized Kharon technician",
      jobReference: certificate.job_id || undefined,
      complianceStandard: "SANS Standard",
      certificateNumber: `CERT-${certificate.id}`
    });

    await auditEvent(db, request, {
      eventType: "admin.certificate.pdf",
      entityType: "certificate",
      entityId: certificate.id,
      outcome: "success",
      user: locals.user,
      metadata: { status: certificate.status, jobId: certificate.job_id || "none" }
    });

    return new Response(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="certificate-${certificate.id}.pdf"`,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    console.error("Certificate PDF generation failed:", error);
    return serverError("Certificate PDF generation failed.");
  }
}

export function ALL() {
  return methodNotAllowed(["GET"]);
}
