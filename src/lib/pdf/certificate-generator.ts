import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface CertificateData {
  id: string;
  certificateType: string;
  issuedDate: string;
  expiryDate: string;
  status: string;
  systemType: string;
  coverageArea: string;
  companyName: string;
  technicianName: string;
  jobReference?: string;
  complianceStandard: string;
  certificateNumber: string;
}

export async function generateCertificatePDF(certificateData: CertificateData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Embed the standard font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Add a page
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  const { width, height } = page.getSize();
  
  // Draw the certificate header
  page.drawText('CERTIFICATE OF COMPLIANCE', {
    x: width / 2 - 150,
    y: height - 100,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Draw the company logo or header information
  page.drawText('KHARON FIRE AND SECURITY SOLUTIONS', {
    x: width / 2 - 120,
    y: height - 130,
    size: 14,
    font: helveticaBoldFont,
    color: rgb(0.2, 0.2, 0.8), // Blue color for branding
  });
  
  page.drawText('Reg. No: 2016/313076/07', {
    x: width / 2 - 60,
    y: height - 150,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Draw the certificate details
  const startY = height - 200;
  let currentY = startY;
  
  // Company name
  page.drawText(`Company: ${certificateData.companyName}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  // System details
  page.drawText(`System Type: ${certificateData.systemType}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  page.drawText(`Coverage Area: ${certificateData.coverageArea}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  // Certificate details
  page.drawText(`Certificate Type: ${certificateData.certificateType}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  page.drawText(`Certificate Number: ${certificateData.certificateNumber}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  page.drawText(`Compliance Standard: ${certificateData.complianceStandard}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  // Dates
  page.drawText(`Issued Date: ${certificateData.issuedDate}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  page.drawText(`Expiry Date: ${certificateData.expiryDate}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 20;
  
  // Technician information
  page.drawText(`Certified by: ${certificateData.technicianName}`, {
    x: 50,
    y: currentY,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  currentY -= 30;
  
  // Status
  const statusColor = certificateData.status === 'Valid' 
    ? rgb(0, 0.7, 0) // Green for valid
    : certificateData.status === 'Expired' 
      ? rgb(0.8, 0, 0) // Red for expired
      : rgb(0.8, 0.6, 0); // Amber for other statuses
  
  page.drawText(`Status: ${certificateData.status}`, {
    x: 50,
    y: currentY,
    size: 14,
    font: helveticaBoldFont,
    color: statusColor,
  });
  currentY -= 40;
  
  // Signature area
  page.drawLine({
    start: { x: 50, y: currentY },
    end: { x: 200, y: currentY },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Authorized Signatory', {
    x: 50,
    y: currentY - 15,
    size: 10,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Company stamp area
  page.drawRectangle({
    x: width - 150,
    y: currentY - 50,
    width: 100,
    height: 50,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  
  page.drawText('Official Stamp', {
    x: width - 135,
    y: currentY - 25,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Footer
  page.drawText('This certificate is valid only with the official stamp and signature.', {
    x: 50,
    y: 50,
    size: 9,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText('For verification, visit: www.kharon.co.za/certificate-verification', {
    x: 50,
    y: 35,
    size: 9,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // Serialize the PDF document to bytes (a Uint8Array)
  return await pdfDoc.save();
}

/**
 * Generate batch certificates for multiple systems
 */
export async function generateBatchCertificates(certificates: CertificateData[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  for (const cert of certificates) {
    // Add a new page for each certificate
    if (pdfDoc.getPageCount() > 0) {
      pdfDoc.addPage();
    }
    
    const page = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
    const { width, height } = page.getSize();
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw certificate content similar to single certificate
    page.drawText('CERTIFICATE OF COMPLIANCE', {
      x: width / 2 - 150,
      y: height - 100,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    
    // Add other certificate details...
    page.drawText(`Certificate ID: ${cert.id}`, {
      x: 50,
      y: height - 130,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Company: ${cert.companyName}`, {
      x: 50,
      y: height - 160,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    
    // Add more fields as needed
  }
  
  return await pdfDoc.save();
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(certificateId: string): Promise<boolean> {
  // In a real implementation, this would check against the database
  // and verify the certificate hasn't been revoked
  console.log(`Verifying certificate: ${certificateId}`);
  return true; // Placeholder implementation
}
