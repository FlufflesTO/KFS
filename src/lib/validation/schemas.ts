/**
 * Project Sentinel - Validation Schemas
 * Purpose: Centralized Zod schemas for all API endpoints and data mutations
 * Dependencies: zod
 * Structural Role: Validation Layer
 */

import { z } from "zod";

// Shared Patterns
const EmailSchema = z.string().email().max(120);
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
