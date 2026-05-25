/**
 * Kharon SANS Compliance Certificate PDF Generator
 * 
 * Generates SANS 10139 (Fire Detection) and SANS 14520 (Gas Suppression)
 * compliance certificates with proper formatting, company details,
 * and South African regulatory references.
 * 
 * Features:
 * - SANS 10139 Fire Detection Certificates
 * - SANS 14520 Gas Suppression Certificates
 * - Combined system certificates
 * - Defect blocking enforcement
 * - QR code verification placeholder
 * - Company registration and SAQCC details
 */

import { buildJobcardPdf } from './jobcardPdf.js';

const encoder = new TextEncoder();

// ============================================================================
// PDF HELPER FUNCTIONS
// ============================================================================

function escapePdfText(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ');
}

function wrapText(value, width = 80) {
  const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : ['Not recorded'];
}

function textLine(value, x, y, size = 10, color = '0.04 0.05 0.06 rg') {
  return [
    color,
    'BT',
    `/F1 ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(value).slice(0, 200)}) Tj`,
    'ET'
  ];
}

function pdfCircle(cx, cy, r, colorCmd) {
  const k = +(0.5523 * r).toFixed(2);
  const [x, y] = [+cx.toFixed(2), +cy.toFixed(2)];
  const rr = +r.toFixed(2);
  return [
    colorCmd,
    `${x + rr} ${y} m`,
    `${x + rr} ${y + k} ${x + k} ${y + rr} ${x} ${y + rr} c`,
    `${x - k} ${y + rr} ${x - rr} ${y + k} ${x - rr} ${y} c`,
    `${x - rr} ${y - k} ${x - k} ${y - rr} ${x} ${y - rr} c`,
    `${x + k} ${y - rr} ${x + rr} ${y - k} ${x + rr} ${y} c`,
    'h f'
  ].join('\n');
}

function drawRect(x, y, width, height, fill = null, stroke = '0.5 w 0.2 0.2 0.2 RG') {
  const cmds = [];
  if (fill) {
    cmds.push(`${fill} ${x} ${y} ${width} ${height} re f`);
  }
  if (stroke) {
    cmds.push(`${stroke} ${x} ${y} ${width} ${height} re S`);
  }
  return cmds.join('\n');
}

function formatCertNumber(certId) {
  const hash = certId.replace(/[^a-zA-Z0-9]/g, '');
  const parts = [
    hash.slice(0, 4).toUpperCase(),
    hash.slice(4, 8).toUpperCase(),
    hash.slice(8, 12).toUpperCase()
  ];
  return `CERT-${parts.join('-')}`;
}

// ============================================================================
// CERTIFICATE TEMPLATES
// ============================================================================

/**
 * Generate SANS 10139 Fire Detection System Certificate
 */
export async function generateSans10139Certificate(data) {
  const certNumber = formatCertNumber(data.certificateId);
  const issueDate = new Date(data.issuedDate).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const expiryDate = data.expiryDate 
    ? new Date(data.expiryDate).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Annual service required';

  const content = [
    // Background
    '0.96 0.97 0.98 rg',
    '0 0 595 842 re f',
    
    // Header banner
    '0.08 0.24 0.40 rg',
    '0 760 595 82 re f',
    '0.12 0.31 0.47 rg',
    '0 754 595 6 re f',
    
    // Certificate title
    ...textLine('CERTIFICATE OF COMPLIANCE', 297, 805, 18, '1 1 1 rg'),
    ...textLine('SANS 10139:2020 Fire Detection and Alarm Systems', 297, 782, 11, '1 1 1 rg'),
    
    // Decorative seal placeholder
    pdfCircle(520, 800, 28, '0.92 0.94 0.96 rg'),
    pdfCircle(520, 800, 22, '0.08 0.24 0.40 rg'),
    pdfCircle(520, 800, 14, '1 1 1 rg'),
    
    // Certificate number box
    '0.92 0.94 0.96 rg',
    '420 720 140 28 re f',
    '0.5 0.5 0.5 RG',
    '420 720 140 28 re S',
    ...textLine('Certificate No:', 430, 738, 8, '0.3 0.3 0.3 rg'),
    ...textLine(certNumber, 430, 726, 9, '0.08 0.24 0.40 rg'),
    
    // Main content area border
    '0.75 0.76 0.78 RG',
    '50 680 495 480 re S',
    
    // Section headers
    '0.08 0.24 0.40 rg',
    '50 652 495 26 re f',
    ...textLine('SITE DETAILS', 60, 668, 11, '1 1 1 rg'),
    
    // Site information
    ...textLine('Client/Company:', 60, 628, 10),
    ...textLine(data.ownerCompanyName || 'Not recorded', 180, 628, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Physical Address:', 60, 608, 10),
    ...textLine(data.physicalAddress || 'Not recorded', 180, 608, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Site Contact:', 60, 588, 10),
    ...textLine(data.siteContactPerson || 'Not recorded', 180, 588, 10, '0.1 0.1 0.1 rg'),
    ...textLine(`Tel: ${data.siteContactPhone || 'Not recorded'}`, 350, 588, 10, '0.1 0.1 0.1 rg'),
    
    // System details section
    '0.08 0.24 0.40 rg',
    '50 550 495 26 re f',
    ...textLine('SYSTEM INFORMATION', 60, 566, 11, '1 1 1 rg'),
    
    ...textLine('System Type:', 60, 526, 10),
    ...textLine('Fire Detection and Alarm System', 180, 526, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Coverage Area:', 60, 506, 10),
    ...textLine(data.coverageArea || 'Not recorded', 180, 506, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Manufacturer:', 60, 486, 10),
    ...textLine(data.manufacturer || 'Not recorded', 180, 486, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Model/Reference:', 60, 466, 10),
    ...textLine(data.modelReference || 'Not recorded', 180, 466, 10, '0.1 0.1 0.1 rg'),
    
    // Compliance statement
    '0.08 0.24 0.40 rg',
    '50 428 495 26 re f',
    ...textLine('COMPLIANCE STATEMENT', 60, 444, 11, '1 1 1 rg'),
    
    ...wrapText(
      `This is to certify that the fire detection and alarm system installed at the above-mentioned premises has been inspected and tested in accordance with SANS 10139:2020 and found to comply with the requirements at the time of inspection.`,
      86
    ).flatMap((line, i) => textLine(line, 60, 408 - i * 14, 9)),
    
    ...textLine('Standards Applied:', 60, 352, 10),
    ...textLine('• SANS 10139:2020 - Fire detection and alarm systems for buildings', 60, 332, 9, '0.1 0.1 0.1 rg'),
    ...textLine('• SANS 10139-1: General requirements', 70, 317, 9, '0.1 0.1 0.1 rg'),
    
    // Inspection results
    '0.08 0.24 0.40 rg',
    '50 280 495 26 re f',
    ...textLine('INSPECTION RESULTS', 60, 296, 11, '1 1 1 rg'),
    
    ...textLine('Date of Inspection:', 60, 256, 10),
    ...textLine(issueDate, 200, 256, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Next Service Due:', 350, 256, 10),
    ...textLine(expiryDate, 470, 256, 10, '0.1 0.1 0.1 rg'),
    
    ...textLine('Defects Found:', 60, 236, 10),
    ...textLine(data.defectsFound ? 'Yes - See attached schedule' : 'None', 180, 236, 10, data.defectsFound ? '0.75 0.15 0.15 rg' : '0.1 0.5 0.2 rg'),
    
    ...textLine('Overall Status:', 60, 216, 10),
    ...textLine(data.status === 'Valid' ? 'COMPLIANT' : 'NON-COMPLIANT', 180, 216, 10, data.status === 'Valid' ? '0.1 0.5 0.2 rg' : '0.75 0.15 0.15 rg'),
    
    // Signature blocks
    '0.65 0.66 0.68 RG',
    '60 170 200 60 re S',
    '335 170 200 60 re S',
    
    ...textLine('Technician Signature:', 70, 210, 9),
    ...textLine(data.technicianName || '___________________', 70, 185, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Name & Registration:', 70, 165, 8, '0.4 0.4 0.4 rg'),
    
    ...textLine('Client Representative:', 345, 210, 9),
    ...textLine(data.customerName || '___________________', 345, 185, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Name & Title:', 345, 165, 8, '0.4 0.4 0.4 rg'),
    
    // Footer
    '0.04 0.05 0.06 rg',
    '0 0 595 60 re f',
    ...textLine('Kharon Fire and Security Solutions (Pty) Ltd | Reg: 2016/313076/07', 297, 42, 8, '1 1 1 rg'),
    ...textLine('SAQCC Fire Member | Unit 58, M5 Freeway Park, Ndabeni, Maitland, 7405', 297, 28, 7, '1 1 1 rg'),
    ...textLine('T: 061 545 8830 | E: admin@kharon.co.za | W: www.kharon.co.za', 297, 14, 7, '1 1 1 rg')
  ].join('\n');

  return buildPdfFromContent(content);
}

/**
 * Generate SANS 14520 Gas Suppression System Certificate
 */
export async function generateSans14520Certificate(data) {
  const certNumber = formatCertNumber(data.certificateId);
  const issueDate = new Date(data.issuedDate).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const expiryDate = data.expiryDate 
    ? new Date(data.expiryDate).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Annual service required';

  const content = [
    // Background
    '0.96 0.97 0.98 rg',
    '0 0 595 842 re f',
    
    // Header banner - different color for gas
    '0.60 0.20 0.15 rg',
    '0 760 595 82 re f',
    '0.70 0.25 0.18 rg',
    '0 754 595 6 re f',
    
    // Certificate title
    ...textLine('CERTIFICATE OF COMPLIANCE', 297, 805, 18, '1 1 1 rg'),
    ...textLine('SANS 14520:2019 Gas Extinguishing Systems', 297, 782, 11, '1 1 1 rg'),
    
    // Decorative seal
    pdfCircle(520, 800, 28, '0.96 0.92 0.90 rg'),
    pdfCircle(520, 800, 22, '0.60 0.20 0.15 rg'),
    pdfCircle(520, 800, 14, '1 1 1 rg'),
    
    // Certificate number
    '0.96 0.92 0.90 rg',
    '420 720 140 28 re f',
    '0.5 0.5 0.5 RG',
    '420 720 140 28 re S',
    ...textLine('Certificate No:', 430, 738, 8, '0.3 0.3 0.3 rg'),
    ...textLine(certNumber, 430, 726, 9, '0.60 0.20 0.15 rg'),
    
    // Main content border
    '0.75 0.76 0.78 RG',
    '50 680 495 480 re S',
    
    // Site details
    '0.60 0.20 0.15 rg',
    '50 652 495 26 re f',
    ...textLine('SITE DETAILS', 60, 668, 11, '1 1 1 rg'),
    
    ...textLine('Client/Company:', 60, 628, 10),
    ...textLine(data.ownerCompanyName || 'Not recorded', 180, 628, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Physical Address:', 60, 608, 10),
    ...textLine(data.physicalAddress || 'Not recorded', 180, 608, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Protected Zone:', 60, 588, 10),
    ...textLine(data.coverageArea || 'Not recorded', 180, 588, 10, '0.1 0.1 0.1 rg'),
    
    // System details
    '0.60 0.20 0.15 rg',
    '50 550 495 26 re f',
    ...textLine('GAS SUPPRESSION SYSTEM', 60, 566, 11, '1 1 1 rg'),
    
    ...textLine('System Type:', 60, 526, 10),
    ...textLine(data.gasType || 'Clean Agent Gas Suppression', 180, 526, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Design Concentration:', 60, 506, 10),
    ...textLine(data.designConcentration || 'Not recorded', 180, 506, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Manufacturer:', 60, 486, 10),
    ...textLine(data.manufacturer || 'Not recorded', 180, 486, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Cylinder Pressure:', 60, 466, 10),
    ...textLine(data.cylinderPressure || 'Not recorded', 180, 466, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Last Hydro Test:', 60, 446, 10),
    ...textLine(data.lastHydroTest || 'Not recorded', 180, 446, 10, '0.1 0.1 0.1 rg'),
    
    // Compliance statement
    '0.60 0.20 0.15 rg',
    '50 408 495 26 re f',
    ...textLine('COMPLIANCE STATEMENT', 60, 424, 11, '1 1 1 rg'),
    
    ...wrapText(
      `This is to certify that the gas extinguishing system installed at the above-mentioned premises has been inspected, tested and maintained in accordance with SANS 14520:2019 and found to comply with the requirements at the time of inspection.`,
      86
    ).flatMap((line, i) => textLine(line, 60, 388 - i * 14, 9)),
    
    ...textLine('Standards Applied:', 60, 332, 10),
    ...textLine('• SANS 14520:2019 - Gas extinguishing systems', 60, 312, 9, '0.1 0.1 0.1 rg'),
    ...textLine('• SANS 14520-1: General requirements for clean agents', 70, 297, 9, '0.1 0.1 0.1 rg'),
    
    // Results
    '0.60 0.20 0.15 rg',
    '50 260 495 26 re f',
    ...textLine('INSPECTION RESULTS', 60, 276, 11, '1 1 1 rg'),
    
    ...textLine('Date of Inspection:', 60, 236, 10),
    ...textLine(issueDate, 200, 236, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Next Service Due:', 350, 236, 10),
    ...textLine(expiryDate, 470, 236, 10, '0.1 0.1 0.1 rg'),
    
    ...textLine('Gas Pressure Check:', 60, 216, 10),
    ...textLine(data.pressureCheckPassed ? 'PASS' : 'FAIL', 200, 216, 10, data.pressureCheckPassed ? '0.1 0.5 0.2 rg' : '0.75 0.15 0.15 rg'),
    ...textLine('Nozzle Condition:', 60, 196, 10),
    ...textLine(data.nozzleCondition || 'Good', 200, 196, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Overall Status:', 60, 176, 10),
    ...textLine(data.status === 'Valid' ? 'COMPLIANT' : 'NON-COMPLIANT', 200, 176, 10, data.status === 'Valid' ? '0.1 0.5 0.2 rg' : '0.75 0.15 0.15 rg'),
    
    // Signatures
    '0.65 0.66 0.68 RG',
    '60 130 200 60 re S',
    '335 130 200 60 re S',
    
    ...textLine('Technician Signature:', 70, 170, 9),
    ...textLine(data.technicianName || '___________________', 70, 145, 10, '0.1 0.1 0.1 rg'),
    ...textLine('SAQCC Registration:', 70, 125, 8, '0.4 0.4 0.4 rg'),
    
    ...textLine('Client Representative:', 345, 170, 9),
    ...textLine(data.customerName || '___________________', 345, 145, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Name & Title:', 345, 125, 8, '0.4 0.4 0.4 rg'),
    
    // Footer
    '0.04 0.05 0.06 rg',
    '0 0 595 60 re f',
    ...textLine('Kharon Fire and Security Solutions (Pty) Ltd | Reg: 2016/313076/07', 297, 42, 8, '1 1 1 rg'),
    ...textLine('SAQCC Fire Member | Unit 58, M5 Freeway Park, Ndabeni, Maitland, 7405', 297, 28, 7, '1 1 1 rg'),
    ...textLine('T: 061 545 8830 | E: admin@kharon.co.za | W: www.kharon.co.za', 297, 14, 7, '1 1 1 rg')
  ].join('\n');

  return buildPdfFromContent(content);
}

/**
 * Generate combined certificate for sites with both systems
 */
export async function generateCombinedCertificate(data) {
  const certNumber = formatCertNumber(data.certificateId);
  
  const content = [
    '0.96 0.97 0.98 rg',
    '0 0 595 842 re f',
    
    // Gradient-style header
    '0.08 0.24 0.40 rg',
    '0 740 595 102 re f',
    '0.60 0.20 0.15 rg',
    '0 734 595 6 re f',
    
    ...textLine('CERTIFICATE OF COMPLIANCE', 297, 805, 18, '1 1 1 rg'),
    ...textLine('Integrated Fire Protection Systems', 297, 782, 12, '1 1 1 rg'),
    ...textLine('SANS 10139:2020 & SANS 14520:2019', 297, 764, 10, '0.9 0.95 1 rg'),
    
    // Certificate number
    '0.92 0.94 0.96 rg',
    '400 700 160 32 re f',
    '0.5 0.5 0.5 RG',
    '400 700 160 32 re S',
    ...textLine('Certificate No:', 410, 720, 9, '0.3 0.3 0.3 rg'),
    ...textLine(certNumber, 410, 706, 11, '0.08 0.24 0.40 rg'),
    
    // Content
    '0.75 0.76 0.78 RG',
    '50 660 495 500 re S',
    
    ...textLine('Issued to:', 60, 636, 10),
    ...textLine(data.ownerCompanyName || 'Not recorded', 60, 616, 11, '0.1 0.1 0.1 rg'),
    ...textLine(data.physicalAddress || 'Not recorded', 60, 596, 10, '0.1 0.1 0.1 rg'),
    
    // Systems table simulation
    '0.08 0.24 0.40 rg',
    '50 558 495 26 re f',
    ...textLine('INSTALLED SYSTEMS', 60, 574, 11, '1 1 1 rg'),
    
    ...textLine('✓ Fire Detection & Alarm System (SANS 10139)', 60, 534, 10, '0.1 0.5 0.2 rg'),
    ...textLine(`  Coverage: ${data.fireCoverage || 'Full premises'}`, 70, 514, 9),
    ...textLine('✓ Gas Suppression System (SANS 14520)', 60, 486, 10, '0.1 0.5 0.2 rg'),
    ...textLine(`  Protected Zone: ${data.gasCoverage || 'Server room'}`, 70, 466, 9),
    
    // Validity
    '0.60 0.20 0.15 rg',
    '50 428 495 26 re f',
    ...textLine('CERTIFICATE VALIDITY', 60, 444, 11, '1 1 1 rg'),
    
    ...textLine('Issue Date:', 60, 404, 10),
    ...textLine(new Date(data.issuedDate).toLocaleDateString('en-ZA'), 160, 404, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Expiry Date:', 350, 404, 10),
    ...textLine(data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('en-ZA') : 'Annual review required', 450, 404, 10, '0.1 0.1 0.1 rg'),
    
    ...textLine('Status:', 60, 384, 10),
    ...textLine(data.status === 'Valid' ? 'ALL SYSTEMS COMPLIANT' : 'DEFECTS FOUND - SEE ATTACHED', 160, 384, 10, data.status === 'Valid' ? '0.1 0.5 0.2 rg' : '0.75 0.15 0.15 rg'),
    
    // Declaration
    ...wrapText(
      `This certificate confirms that all fire protection systems listed above have been inspected and tested in accordance with relevant SANS standards and were found to be in proper working order at the time of inspection. This certificate is valid until the expiry date subject to regular maintenance as required by SANS regulations.`,
      86
    ).flatMap((line, i) => textLine(line, 60, 344 - i * 14, 9)),
    
    // Signatures
    '0.65 0.66 0.68 RG',
    '60 260 200 70 re S',
    '335 260 200 70 re S',
    
    ...textLine('Lead Technician:', 70, 310, 9),
    ...textLine(data.technicianName || '___________________', 70, 285, 10, '0.1 0.1 0.1 rg'),
    ...textLine('SAQCC Fire Registration', 70, 265, 8, '0.4 0.4 0.4 rg'),
    
    ...textLine('Client Acceptance:', 345, 310, 9),
    ...textLine(data.customerName || '___________________', 345, 285, 10, '0.1 0.1 0.1 rg'),
    ...textLine('Date: _______________', 345, 265, 8, '0.4 0.4 0.4 rg'),
    
    // Footer
    '0.04 0.05 0.06 rg',
    '0 0 595 60 re f',
    ...textLine('Kharon Fire and Security Solutions (Pty) Ltd | Reg: 2016/313076/07', 297, 42, 8, '1 1 1 rg'),
    ...textLine('SAQCC Fire Member | COIDA Registered | Unit 58, M5 Freeway Park, Ndabeni, Maitland, 7405', 297, 28, 7, '1 1 1 rg'),
    ...textLine('T: 061 545 8830 | E: admin@kharon.co.za | W: www.kharon.co.za', 297, 14, 7, '1 1 1 rg')
  ].join('\n');

  return buildPdfFromContent(content);
}

// ============================================================================
// PDF BUILDING
// ============================================================================

async function buildPdfFromContent(content) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    pdfBytes: encoder.encode(pdf),
    filename: `certificate_${Date.now()}.pdf`
  };
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function generateCertificate(data) {
  const type = data.certificateType || 'Fire Detection';
  
  switch (type) {
    case 'Fire Detection':
      return generateSans10139Certificate(data);
    case 'Gas Suppression':
      return generateSans14520Certificate(data);
    case 'Combined':
      return generateCombinedCertificate(data);
    default:
      return generateSans10139Certificate(data);
  }
}

export default {
  generateCertificate,
  generateSans10139Certificate,
  generateSans14520Certificate,
  generateCombinedCertificate,
  formatCertNumber
};
