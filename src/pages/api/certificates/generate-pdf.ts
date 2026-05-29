import { generateCertificatePDF } from "../../../lib/pdf/certificate-generator";
import type { CertificateData } from "../../../lib/pdf/certificate-generator";

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    
    // Validate required fields
    if (!body.id || !body.certificateType || !body.issuedDate || !body.companyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const certificateData: CertificateData = {
      id: body.id,
      certificateType: body.certificateType,
      issuedDate: body.issuedDate,
      expiryDate: body.expiryDate || "",
      status: body.status || "Valid",
      systemType: body.systemType || "N/A",
      coverageArea: body.coverageArea || "N/A",
      companyName: body.companyName,
      technicianName: body.technicianName || "N/A",
      jobReference: body.jobReference,
      complianceStandard: body.complianceStandard || "SANS Standard",
      certificateNumber: body.certificateNumber || `CERT-${Date.now()}`
    };
    
    // Generate PDF
    const pdfBytes = await generateCertificatePDF(certificateData);
    
    // Return PDF as response
    return new Response(pdfBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificateData.id}.pdf"`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Certificate PDF generation failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate certificate PDF" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
