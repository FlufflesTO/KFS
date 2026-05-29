/**
 * Project Sentinel - SARS-Compliant PDF Invoice Generator
 * Purpose: Generates SARS VAT-compliant tax invoices in raw PDF format
 * Dependencies: None
 * Structural Role: PDF generation layer for non-Sage client invoicing
 * 
 * SARS Compliance Requirements:
 * - Vendor registration number (VAT format: NNNN/NNNNNN/NN)
 * - Company registration number (CIPC format: YYYY/NNNNNN/NN)
 * - Tax invoice label prominently displayed
 * - Supplier & customer details with VAT numbers
 * - Sequential invoice numbering
 * - VAT breakdown at each rate (standard 15%)
 * - All amounts in ZAR cents (minor units)
 */

const encoder = new TextEncoder();

// ─── Type Definitions ─────────────────────────────────────────────────────

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPriceExclVatCents: number;
  vatRate: number; // e.g., 15 for 15%
}

export interface InvoiceParty {
  name: string;
  physicalAddress: string;
  vatNumber?: string | null; // Required for supplier, optional for customer
}

export interface InvoiceData {
  invoiceNumber: string; // Sequential, unique
  invoiceDate: string; // ISO format YYYY-MM-DD
  supplyDate?: string | null; // If different from invoice date
  supplier: InvoiceParty;
  customer: InvoiceParty;
  lineItems: InvoiceLineItem[];
  companyRegistrationNumber: string; // CIPC format
  purchaseOrderNumber?: string | null;
  paymentTerms?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankBranchCode?: string | null;
  reference?: string | null;
}

export interface InvoiceValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface InvoicePdfResult {
  pdfBytes: Uint8Array;
  signatureHash: string;
  totalExclVatCents: number;
  totalVatCents: number;
  totalInclVatCents: number;
}

// ─── SARS VAT Compliance Helpers ──────────────────────────────────────────

/**
 * Validates and formats a South African VAT registration number.
 * Format: NNNN/NNNNNN/NN (4 digits, slash, 10 digits, slash, 2 digits)
 * Example: 4038/51471639/07
 */
export function formatVATNumber(vat: string | null | undefined): string {
  if (!vat) return "";
  
  const cleaned = vat.replace(/\D/g, "");
  
  // SARS VAT number is typically 10 digits (e.g., 403851471639)
  // Some formats include leading zeros or different groupings
  if (cleaned.length === 10) {
    // Standard 10-digit format: NNNN/NNNNNN
    return `${cleaned.slice(0, 4)}/${cleaned.slice(4, 10)}`;
  }
  
  if (cleaned.length === 12) {
    // Extended format with branch: NNNN/NNNNNN/NN
    return `${cleaned.slice(0, 4)}/${cleaned.slice(4, 10)}/${cleaned.slice(10, 12)}`;
  }
  
  if (cleaned.length === 14) {
    // Full format: YYYY/NNNNNN/NN
    return `${cleaned.slice(0, 4)}/${cleaned.slice(4, 10)}/${cleaned.slice(10, 14)}`;
  }
  
  // Return as-is if format is unknown
  return vat;
}

/**
 * Validates a VAT number format for SARS compliance.
 */
export function validateVATNumber(vat: string | null | undefined): boolean {
  if (!vat) return false;
  
  const cleaned = vat.replace(/\D/g, "");
  // Valid lengths: 10 (standard), 12 (with branch), 14 (full format)
  return cleaned.length >= 10 && cleaned.length <= 14;
}

/**
 * Validates a CIPC company registration number.
 * Format: YYYY/NNNNNN/NN (year, sequence, suffix)
 * Example: 2016/313076/07
 */
export function validateCompanyRegistrationNumber(reg: string | null | undefined): boolean {
  if (!reg) return false;
  
  // Check format: YYYY/NNNNNN/NN or YYYYNNNNNNNN
  const cleaned = reg.replace(/\D/g, "");
  if (cleaned.length !== 10) return false;
  
  // Year should be reasonable (1900-2099)
  const year = parseInt(cleaned.slice(0, 4), 10);
  return year >= 1900 && year <= 2099;
}

/**
 * Calculates VAT amount in cents.
 * @param amountExclVatCents - Amount excluding VAT in cents
 * @param rate - VAT rate as percentage (e.g., 15 for 15%)
 * @returns VAT amount in cents (rounded to nearest cent)
 */
export function calculateVAT(amountExclVatCents: number, rate: number): number {
  if (rate <= 0) return 0;
  // Calculate VAT and round to nearest cent
  return Math.round((amountExclVatCents * rate) / 100);
}

/**
 * Formats cents as ZAR currency string.
 * @param cents - Amount in cents
 * @returns Formatted string (e.g., "R 1,234.56")
 */
export function formatCurrency(cents: number): string {
  const rands = cents / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rands);
}

/**
 * Validates invoice data for SARS compliance.
 */
export function validateInvoiceData(invoice: InvoiceData): InvoiceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Supplier validation
  if (!invoice.supplier.name || invoice.supplier.name.trim().length === 0) {
    errors.push("Supplier name is required");
  }
  if (!invoice.supplier.physicalAddress || invoice.supplier.physicalAddress.trim().length === 0) {
    errors.push("Supplier physical address is required");
  }
  if (!validateVATNumber(invoice.supplier.vatNumber)) {
    errors.push("Supplier VAT registration number is required and must be valid");
  }

  // Customer validation
  if (!invoice.customer.name || invoice.customer.name.trim().length === 0) {
    errors.push("Customer name is required");
  }
  if (!invoice.customer.physicalAddress || invoice.customer.physicalAddress.trim().length === 0) {
    errors.push("Customer physical address is required");
  }

  // Invoice metadata validation
  if (!invoice.invoiceNumber || invoice.invoiceNumber.trim().length === 0) {
    errors.push("Invoice number is required");
  }
  if (!invoice.invoiceDate) {
    errors.push("Invoice date is required");
  }
  if (!validateCompanyRegistrationNumber(invoice.companyRegistrationNumber)) {
    errors.push("Company registration number must be in valid CIPC format (YYYY/NNNNNN/NN)");
  }

  // Line items validation
  if (!invoice.lineItems || invoice.lineItems.length === 0) {
    errors.push("At least one line item is required");
  } else {
    invoice.lineItems.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        errors.push(`Line item ${index + 1}: Description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Line item ${index + 1}: Quantity must be positive`);
      }
      if (item.unitPriceExclVatCents < 0) {
        errors.push(`Line item ${index + 1}: Unit price cannot be negative`);
      }
      if (item.vatRate < 0 || item.vatRate > 100) {
        errors.push(`Line item ${index + 1}: VAT rate must be between 0 and 100`);
      }
    });
  }

  // Warnings for best practices
  if (invoice.supplier.vatNumber && !invoice.customer.vatNumber) {
    warnings.push("Customer VAT number not provided - may affect input tax claims");
  }
  if (!invoice.paymentTerms) {
    warnings.push("Payment terms not specified");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculates invoice totals from line items.
 */
function calculateInvoiceTotals(lineItems: InvoiceLineItem[]): {
  totalExclVatCents: number;
  totalVatCents: number;
  totalInclVatCents: number;
  vatBreakdown: Map<number, { amountExclVatCents: number; vatAmountCents: number }>;
} {
  let totalExclVatCents = 0;
  let totalVatCents = 0;
  const vatBreakdown = new Map<number, { amountExclVatCents: number; vatAmountCents: number }>();

  for (const item of lineItems) {
    const lineTotalExclVat = item.quantity * item.unitPriceExclVatCents;
    const lineVat = calculateVAT(lineTotalExclVat, item.vatRate);
    
    totalExclVatCents += lineTotalExclVat;
    totalVatCents += lineVat;

    // Accumulate VAT breakdown by rate
    const existing = vatBreakdown.get(item.vatRate) || { amountExclVatCents: 0, vatAmountCents: 0 };
    vatBreakdown.set(item.vatRate, {
      amountExclVatCents: existing.amountExclVatCents + lineTotalExclVat,
      vatAmountCents: existing.vatAmountCents + lineVat
    });
  }

  const totalInclVatCents = totalExclVatCents + totalVatCents;

  return {
    totalExclVatCents,
    totalVatCents,
    totalInclVatCents,
    vatBreakdown
  };
}

// ─── PDF Generation Helpers ───────────────────────────────────────────────

function escapePdfText(value: string | null | undefined): string {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ");
}

function textLine(value: string | null | undefined, x: number, y: number, size: number = 10, color: string = "0.04 0.05 0.06 rg"): string[] {
  return [
    color,
    "BT",
    `/F1 ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(value).slice(0, 180)}) Tj`,
    "ET"
  ];
}

function textLineBold(value: string | null | undefined, x: number, y: number, size: number = 10, color: string = "0.04 0.05 0.06 rg"): string[] {
  return [
    color,
    "BT",
    `/F2 ${size} Tf`,
    `${x} ${y} Td`,
    `(${escapePdfText(value).slice(0, 180)}) Tj`,
    "ET"
  ];
}

function drawLine(x1: number, y1: number, x2: number, y2: number, width: number = 0.5, color: string = "0.75 0.76 0.78 RG"): string[] {
  return [
    color,
    `${width} w`,
    `${x1} ${y1} m`,
    `${x2} ${y2} l`,
    "S"
  ];
}

function drawRect(x: number, y: number, width: number, height: number, fill: string = "0.95 0.96 0.97 rg", stroke: string | null = null): string[] {
  const cmds: string[] = [fill];
  if (stroke) {
    cmds.push(stroke);
  }
  cmds.push(`${x} ${y} ${width} ${height} re f`);
  return cmds;
}

async function sha256Hex(content: string): Promise<string> {
  const bytes = encoder.encode(content);
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// ─── Main PDF Generation ──────────────────────────────────────────────────

export async function generateInvoicePdf(invoice: InvoiceData): Promise<InvoicePdfResult> {
  // Validate invoice data first
  const validation = validateInvoiceData(invoice);
  if (!validation.valid) {
    throw new Error(`Invoice validation failed: ${validation.errors.join("; ")}`);
  }

  // Calculate totals
  const { totalExclVatCents, totalVatCents, totalInclVatCents, vatBreakdown } = calculateInvoiceTotals(invoice.lineItems);

  // Generate signature hash for invoice integrity
  const signatureContent = JSON.stringify({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    supplier: invoice.supplier.name,
    customer: invoice.customer.name,
    totalInclVatCents,
    timestamp: Date.now()
  });
  const signatureHash = await sha256Hex(signatureContent);

  // Build PDF content
  const content = buildInvoiceContent(invoice, {
    totalExclVatCents,
    totalVatCents,
    totalInclVatCents,
    vatBreakdown,
    signatureHash
  });

  // Construct raw PDF
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return {
    pdfBytes: encoder.encode(pdf),
    signatureHash,
    totalExclVatCents,
    totalVatCents,
    totalInclVatCents
  };
}

function buildInvoiceContent(
  invoice: InvoiceData,
  totals: {
    totalExclVatCents: number;
    totalVatCents: number;
    totalInclVatCents: number;
    vatBreakdown: Map<number, { amountExclVatCents: number; vatAmountCents: number }>;
    signatureHash: string;
  }
): string {
  const { signatureHash } = totals;
  let y = 780; // Starting Y position
  const lineHeight = 14;
  const smallLineHeight = 11;

  const content: string[] = [];

  // Background
  content.push(...drawRect(0, 0, 595, 842, "0.98 0.98 0.98 rg"));

  // ─── Header Banner ─────────────────────────────────────────────────────
  content.push(...drawRect(0, 768, 595, 74, "0.04 0.05 0.06 rg"));
  content.push(...drawRect(0, 762, 595, 6, "0.74 0.25 0.10 rg")); // Amber accent

  // Company branding
  content.push(...textLineBold("KHARON", 44, 816, 18, "1 1 1 rg"));
  content.push(...textLine("FIRE & SECURITY SOLUTIONS (PTY) LTD", 44, 797, 10, "1 1 1 rg"));
  content.push(...textLine("Reg No: " + invoice.companyRegistrationNumber, 44, 782, 8, "0.85 0.85 0.85 rg"));

  // TAX INVOICE label (SARS requirement)
  content.push(...drawRect(400, 790, 175, 40, "0.04 0.05 0.06 rg"));
  content.push(...textLineBold("TAX INVOICE", 420, 812, 14, "1 1 1 rg"));

  // Invoice number and date
  content.push(...textLineBold(`Invoice No: ${invoice.invoiceNumber}`, 400, 768, 10, "0.04 0.05 0.06 rg"));
  content.push(...textLine(`Invoice Date: ${invoice.invoiceDate}`, 400, 754, 9));
  if (invoice.supplyDate && invoice.supplyDate !== invoice.invoiceDate) {
    content.push(...textLine(`Supply Date: ${invoice.supplyDate}`, 400, 742, 9));
  }

  y = 720;

  // ─── Supplier Details (SARS Requirement) ────────────────────────────────
  content.push(...textLineBold("Supplier Details", 44, y, 11));
  y -= smallLineHeight;
  content.push(...textLine(invoice.supplier.name, 54, y, 9));
  y -= smallLineHeight;
  content.push(...textLine(invoice.supplier.physicalAddress, 54, y, 9));
  y -= smallLineHeight;
  if (invoice.supplier.vatNumber) {
    content.push(...textLine(`VAT Registration No: ${formatVATNumber(invoice.supplier.vatNumber)}`, 54, y, 9));
  }
  y -= lineHeight;

  // ─── Customer Details (SARS Requirement) ────────────────────────────────
  content.push(...textLineBold("Bill To", 44, y, 11));
  y -= smallLineHeight;
  content.push(...textLine(invoice.customer.name, 54, y, 9));
  y -= smallLineHeight;
  content.push(...textLine(invoice.customer.physicalAddress, 54, y, 9));
  y -= smallLineHeight;
  if (invoice.customer.vatNumber) {
    content.push(...textLine(`VAT Registration No: ${formatVATNumber(invoice.customer.vatNumber)}`, 54, y, 9));
  }
  y -= lineHeight * 1.5;

  // ─── Payment Details (Optional) ─────────────────────────────────────────
  if (invoice.bankAccountNumber || invoice.paymentTerms) {
    content.push(...drawRect(44, y - 5, 527, 60, "0.95 0.96 0.97 rg", "0.82 0.84 0.86 RG"));
    let payY = y - 12;
    
    content.push(...textLineBold("Payment Details", 54, payY, 10));
    payY -= smallLineHeight;
    
    if (invoice.paymentTerms) {
      content.push(...textLine(`Terms: ${invoice.paymentTerms}`, 54, payY, 9));
      payY -= smallLineHeight;
    }
    
    if (invoice.bankAccountName && invoice.bankAccountNumber && invoice.bankBranchCode) {
      content.push(...textLine(`Bank: ${invoice.bankAccountName}`, 54, payY, 9));
      payY -= smallLineHeight;
      content.push(...textLine(`Account: ${invoice.bankAccountNumber}`, 54, payY, 9));
      payY -= smallLineHeight;
      content.push(...textLine(`Branch Code: ${invoice.bankBranchCode}`, 54, payY, 9));
    }
    
    y -= 75;
  }

  // ─── Line Items Table Header ────────────────────────────────────────────
  y -= 10;
  const tableTop = y;
  
  content.push(...drawRect(44, y - 20, 527, 20, "0.04 0.05 0.06 rg"));
  
  content.push(...textLineBold("Description", 54, y - 6, 9, "1 1 1 rg"));
  content.push(...textLineBold("Qty", 320, y - 6, 9, "1 1 1 rg"));
  content.push(...textLineBold("Unit Price", 370, y - 6, 9, "1 1 1 rg"));
  content.push(...textLineBold("VAT", 460, y - 6, 9, "1 1 1 rg"));
  content.push(...textLineBold("Total", 510, y - 6, 9, "1 1 1 rg"));
  
  y -= 25;

  // ─── Line Items ─────────────────────────────────────────────────────────
  for (const item of invoice.lineItems) {
    const lineTotalExclVat = item.quantity * item.unitPriceExclVatCents;
    const lineVat = calculateVAT(lineTotalExclVat, item.vatRate);
    const lineTotalInclVat = lineTotalExclVat + lineVat;

    // Word wrap description if needed
    const descLines = wrapText(item.description, 50);
    const descHeight = descLines.length * smallLineHeight;
    
    for (let i = 0; i < descLines.length; i++) {
      if (i === 0) {
        content.push(...textLine(descLines[i], 54, y, 9));
        content.push(...textLine(String(item.quantity), 320, y, 9));
        content.push(...textLine(formatCurrency(item.unitPriceExclVatCents), 370, y, 9));
        content.push(...textLine(`${item.vatRate}%`, 460, y, 9));
        content.push(...textLine(formatCurrency(lineTotalInclVat), 510, y, 9));
      } else {
        content.push(...textLine(descLines[i], 54, y, 9));
      }
      y -= smallLineHeight;
    }
    
    y -= 5; // Extra spacing between items
  }

  // ─── VAT Breakdown (SARS Requirement) ───────────────────────────────────
  y -= 10;
  
  // Draw separator line
  content.push(...drawLine(44, y, 571, y, 1));
  y -= 10;

  // VAT breakdown table
  content.push(...textLineBold("VAT Breakdown", 44, y, 10));
  y -= smallLineHeight;

  for (const [rate, breakdown] of totals.vatBreakdown.entries()) {
    const vatAmountFormatted = formatCurrency(breakdown.vatAmountCents);
    const baseAmountFormatted = formatCurrency(breakdown.amountExclVatCents);
    
    content.push(...textLine(
      `VAT at ${rate}%: ${baseAmountFormatted} × ${rate}% = ${vatAmountFormatted}`,
      54, y, 9
    ));
    y -= smallLineHeight;
  }

  y -= 5;
  content.push(...drawLine(44, y, 571, y, 1));
  y -= 15;

  // ─── Totals Section ─────────────────────────────────────────────────────
  const totalsX = 380;
  
  // Total excl. VAT
  content.push(...textLine("Total (excl. VAT):", totalsX, y, 10));
  content.push(...textLineBold(formatCurrency(totals.totalExclVatCents), 510, y, 10));
  y -= smallLineHeight;

  // Total VAT
  content.push(...textLine("Total VAT:", totalsX, y, 10));
  content.push(...textLineBold(formatCurrency(totals.totalVatCents), 510, y, 10));
  y -= smallLineHeight;

  // Separator
  content.push(...drawLine(totalsX, y + 2, 571, y + 2, 1.5, "0.04 0.05 0.06 RG"));
  y -= 15;

  // Total incl. VAT (prominent)
  content.push(...textLineBold("TOTAL (incl. VAT):", totalsX, y, 12, "0.04 0.05 0.06 rg"));
  content.push(...textLineBold(formatCurrency(totals.totalInclVatCents), 510, y, 12, "0.74 0.25 0.10 rg"));
  y -= 25;

  // ─── Footer ─────────────────────────────────────────────────────────────
  y = 80;
  
  content.push(...drawLine(44, y + 20, 551, y + 20, 0.5));
  
  // SARS compliance note
  content.push(...textLine("This is a computer-generated tax invoice in compliance with SARS VAT regulations.", 44, y + 8, 8, "0.5 0.5 0.5 rg"));
  content.push(...textLine("VAT Registration: " + formatVATNumber(invoice.supplier.vatNumber), 44, y - 5, 8, "0.5 0.5 0.5 rg"));
  
  // Invoice integrity hash
  const hashRef = `INV-${signatureHash.slice(0, 8)}...${signatureHash.slice(-8)}`;
  content.push(...textLine(`Invoice Hash: ${hashRef}`, 350, y - 5, 7, "0.6 0.6 0.6 rg"));
  
  // Company footer
  content.push(...textLine("Kharon Fire and Security Solutions (Pty) Ltd", 44, y - 25, 8, "0.4 0.4 0.4 rg"));
  content.push(...textLine("All amounts in ZAR (South African Rand)", 44, y - 38, 7, "0.5 0.5 0.5 rg"));

  return content.join("\n");
}

function wrapText(value: string | null | undefined, maxChars: number = 50): string[] {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return [""];
  
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}
