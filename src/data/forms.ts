/**
 * Forms & conversion control layer — SINGLE SOURCE OF TRUTH.
 *
 * Every CTA label, contact intent, request type and form selector option lives here.
 * Service/sector pages reference `intent` slugs only; the contact API resolves the
 * intent to an allowed requestType via INTENT_TO_REQUEST_TYPE.
 *
 * Keep ALLOWED_REQUEST_TYPES in src/lib/validation/schemas.ts in sync with the
 * values referenced here (the API validates against that Zod enum).
 */

/** Approved CTA labels — pages MUST use only these strings. */
export const APPROVED_CTA_LABELS = [
  "Request Site Assessment",
  "Book a Compliance Inspection",
  "Speak to an Engineer",
  "Get a Quote",
  "Report a Fault",
  "Call Now",
  "Discuss a similar project",
  "Access Client Portal"
] as const;
export type ApprovedCtaLabel = (typeof APPROVED_CTA_LABELS)[number];

/** Contact intent slug → human-readable requestType stored on the submission. */
export const INTENT_TO_REQUEST_TYPE: Record<string, string> = {
  "site-assessment": "Site assessment",
  "general": "General enquiry",
  "compliance": "Compliance & Maintenance",
  "emergency": "Emergency technical support",
  // Fire protection
  "fire-detection": "Fire Detection",
  "gas-suppression": "Gas Suppression",
  "pa-pe": "PA / PE Systems",
  "signage": "Fire Safety Signage",
  "fire-doors": "Fire Doors",
  // Security
  "cctv": "CCTV",
  "intrusion": "Intrusion Detection",
  "access-control": "Access Control",
  "integrated-security": "Integrated Security",
  "ironmongery": "Architectural Ironmongery",
  // Sectors
  "data-centre": "Data Centres",
  "electrical-rooms": "Electrical Rooms",
  "warehousing": "Warehousing & Logistics",
  "industrial": "Industrial Facilities",
  "control-rooms": "Control Rooms",
  "healthcare": "Healthcare & Commercial",
  "critical-infrastructure": "Critical Infrastructure"
};

export function resolveRequestType(intent: string | null | undefined): string {
  if (!intent) return "General enquiry";
  return INTENT_TO_REQUEST_TYPE[intent] ?? "General enquiry";
}

/** Service-interest selector options (form dropdown). */
export const SERVICE_INTERESTS = [
  "Fire Detection",
  "Gas Suppression",
  "PA / PE Systems",
  "Fire Safety Signage",
  "Fire Doors",
  "CCTV",
  "Intrusion Detection",
  "Access Control",
  "Integrated Security",
  "Architectural Ironmongery",
  "Compliance & Maintenance",
  "Emergency Support",
  "Not sure / general"
] as const;

export const URGENCY_LEVELS = [
  "Emergency — active fault or risk",
  "Urgent — within days",
  "Planned — within weeks",
  "Researching options"
] as const;

export const SITE_TYPES = [
  "Data centre / server room",
  "Electrical room / switchgear",
  "Warehouse / logistics",
  "Industrial / manufacturing",
  "Control room",
  "Healthcare / commercial",
  "Critical infrastructure / utility",
  "Other"
] as const;

export const CLIENT_TYPES = ["New client", "Existing client"] as const;

/** Analytics event names — use these exact strings for tracking. */
export const ANALYTICS_EVENTS = {
  phoneClick: "phone_click",
  formStart: "form_start",
  formSubmit: "form_submit",
  portalClick: "portal_click",
  emergencyClick: "emergency_click",
  downloadClick: "download_click",
  formSubmitSuccess: "form_submit_success",
  formSubmitError: "form_submit_error",
  caseStudyClick: "case_study_click",
  resourceClick: "resource_click",
  leadMagnetDownload: "lead_magnet_download"
} as const;

/** Canonical phone for tel: links. */
export const PHONE_TEL = "+27615458830";
export const PHONE_DISPLAY = "061 545 8830";
