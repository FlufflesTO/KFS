/**
 * Project Sentinel - Validation Schemas
 * Purpose: Centralized Zod schemas for all API endpoints and data mutations
 * Dependencies: zod
 * Structural Role: Validation Layer
 */

import { z } from "zod";

// Shared Patterns
const EmailSchema = z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email address").max(120);
const NameSchema = z.string().min(2).max(80).regex(/^[a-zA-Z\s\-\.']+$/, "Name contains invalid characters.");
const TextSchema = z.string().min(10).max(3000);

export const ALLOWED_REQUEST_TYPES = [
  "Emergency technical support",
  "Gas suppression evaluation",
  "Fire detection system review",
  "Compliance inspection",
  "Maintenance assessment",
  "Client records access",
  "Gas Suppression",
  "Fire Detection",
  "Compliance & Maintenance",
  "Critical Infrastructure",
  "Integrated Security",
  "Gas suppression assessment",
  "Fire detection review",
  "Compliance assessment",
  "Critical infrastructure protection discussion",
  "Emergency / SLA support",
  "Capability discussion",
  "Sector protection assessment",
  "Integrated infrastructure security review"
] as const;

export const ContactSubmissionSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  requestType: z.enum(ALLOWED_REQUEST_TYPES), // Remove fallback to prevent invalid types
  message: TextSchema,
  popiaConsent: z.boolean().or(z.literal("true")).or(z.literal("on")),
  website: z.string().optional() // Honeypot
}).transform(data => {
  // Normalize variations of consent and requestType
  if (typeof data.popiaConsent !== "boolean") {
    data.popiaConsent = data.popiaConsent === "true" || data.popiaConsent === "on";
  }
  return data;
});

// Future schemas to be added here (e.g., JobCardSchema, QuoteApprovalSchema)
export const JobCardSchema = z.object({
  jobId: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/),
  systemId: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/),
  techComments: z.string().min(3).max(3000),
  signatureBase64: z.string().min(100), // Expecting a reasonable data URI length
  signatureStrokes: z.array(z.any()).optional().default([]),
  faultCategory: z.string().max(120).default("Routine service"),
  partsUsed: z.string().max(500).default("None recorded"),
  followUpActions: z.string().max(1000).default("No follow-up actions recorded"),
  customerName: z.string().max(120).min(2),
  customerTitle: z.string().max(80).optional().default(""),
  evidencePhotos: z.array(z.object({
    dataUri: z.string()
      .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)
      .refine(val => {
        // Base64 is ~33% larger than raw data. 1.5MB is ~2MB base64.
        const base64Length = val.split(',')[1].length;
        const sizeInBytes = (base64Length * 3) / 4;
        return sizeInBytes <= 1572864; // 1.5MB
      }, "Evidence photo must be less than 1.5MB."),
    caption: z.string().max(160).optional().default("")
  })).max(3).default([]),
  defects: z.array(z.object({
    severity: z.enum(["Critical", "Major", "Minor", "Observation"]),
    description: z.string().min(5).max(2000),
    sansClauseRef: z.string().max(80).optional().default(""),
    certificateBlocking: z.boolean().or(z.literal(1)).or(z.literal(0)).transform(val => val === true || val === 1)
  })).max(20).default([])
});

export const QuoteApprovalSchema = z.object({
  quoteId: z.string().min(1),
  status: z.enum(["approved", "rejected"]).default("approved")
});

// Finance / VAT Validation Schemas (SARS Statutory Compliance)
const VAT_RATE = 15 as const; // South African statutory VAT rate

/**
 * Validates that VAT amount is exactly 15% of the ex-VAT amount.
 * Uses integer cents to avoid floating-point precision issues.
 */
function validateVatAmount(exVatCents: number, vatCents: number): boolean {
  const expectedVatCents = Math.round(exVatCents * 0.15);
  return vatCents === expectedVatCents;
}

export const FinanceTaskCreateSchema = z.object({
  siteId: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/, "Invalid siteId format"),
  jobId: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/, "Invalid jobId format").optional().nullable(),
  taskType: z.enum([
    "Quote Required",
    "Quote Issued in Sage",
    "Quote Approved",
    "Invoice Required",
    "Invoice Issued in Sage",
    "Payment Recorded in Sage",
    "Finance Follow-up"
  ]),
  amountExVat: z.number()
    .int("Amount must be an integer (cents)")
    .nonNegative("Amount cannot be negative")
    .max(999999900, "Amount exceeds maximum (R9,999,999.00)"),
  vatAmount: z.number()
    .int("VAT must be an integer (cents)")
    .nonNegative("VAT cannot be negative")
    .refine(
      (vat, ctx) => {
        const exVat = ctx.parent.amountExVat;
        if (!validateVatAmount(exVat, vat)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `VAT amount must be exactly 15% of ex-VAT amount. Expected ${Math.round(exVat * 0.15)} cents, got ${vat} cents.`,
            path: ["vatAmount"]
          });
          return false;
        }
        return true;
      },
      { message: "VAT must be exactly 15% of ex-VAT amount" }
    ),
  reference: z.string().max(120).optional().nullable(),
  financeNotes: z.string().max(500).optional().nullable()
});

export const FinanceTaskUpdateSchema = FinanceTaskCreateSchema.partial().extend({
  id: z.string().regex(/^[A-Za-z0-9_-]{3,80}$/, "Invalid task ID"),
  status: z.enum(["Pending", "In Progress", "Completed", "Cancelled"]).optional()
});
