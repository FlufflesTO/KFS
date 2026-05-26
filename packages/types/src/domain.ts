// Strict type definitions for all Kharon FSM database entities and API contracts.
// All DbX types mirror D1 column names exactly (snake_case).
// camelCase types are for session tokens and API payloads.

export type UserRole = "tech" | "admin" | "client" | "finance";

// ─── Database row types ─────────────────────────────────────────────────────

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  site_id: string | null;
  is_active: number;
  force_password_change: number;
  mfa_required: number;
  mfa_enabled: number;
  last_login_at: string | null;
}

export interface DbSite {
  id: string;
  owner_company_name: string;
  physical_address: string;
  site_contact_person: string | null;
  site_contact_email: string | null;
  site_contact_phone: string | null;
  billing_emails: string;
}

export interface DbSystem {
  id: string;
  site_id: string;
  system_type: string;
  coverage_area: string;
  manufacturer: string | null;
  model_reference: string | null;
  next_due_date: string;
  last_service_date: string | null;
  service_interval_months: number;
  owner_company_name: string;
}

export type SystemForForms = Pick<
  DbSystem,
  "id" | "system_type" | "coverage_area" | "owner_company_name"
>;

export interface DbJob {
  id: string;
  system_id: string;
  assigned_technician_id: string | null;
  scheduled_date: string;
  status: string;
  job_type: string;
  site_notes: string | null;
  priority: string;
  is_emergency: number;
  required_by_date: string | null;
  estimated_duration_minutes: number | null;
  coverage_area: string;
  owner_company_name: string;
}

export interface DbContactEnquiry {
  id: string;
  name: string;
  email: string;
  request_type: string;
  message: string;
  submitted_at: string;
}

export type DefectSeverity = "Critical" | "Major" | "Minor" | "Observation";
export type DefectStatus   = "Open" | "In Progress" | "Resolved" | "Closed";

export interface DbDefect {
  id: string;
  severity: DefectSeverity;
  sans_clause_ref: string | null;
  description: string;
  certificate_blocking: number;
  status: DefectStatus;
  created_at: string;
  system_id: string;
  system_type: string;
  coverage_area: string;
  site_id: string;
  owner_company_name: string;
  job_id: string | null;
}

export type CertStatus = "Valid" | "Blocked" | "Expired" | "Revoked";

export interface DbCertificate {
  id: string;
  certificate_type: string;
  issued_date: string;
  expiry_date: string | null;
  status: CertStatus;
  created_at: string;
  system_id: string;
  system_type: string;
  coverage_area: string;
  site_id: string;
  owner_company_name: string;
  job_id: string | null;
  blocking_severity: string | null;
  blocking_description: string | null;
}

export interface DbClientSiteAccess {
  user_id: string;
  site_id: string;
  granted_at: string;
  user_name: string;
  user_email: string;
  owner_company_name: string;
}

export interface DbFinancialRecord {
  id: string;
  site_id: string;
  amount: number | null;
  item_type: string;
  payment_status: string;
  distribution_date: string | null;
  reference: string | null;
  sage_quote_number: string | null;
  sage_invoice_number: string | null;
  sage_customer_code: string | null;
  sage_amount_ex_vat: number | null;
  sage_vat_amount: number | null;
  sage_amount_inc_vat: number | null;
  sage_document_date: string | null;
  sage_due_date: string | null;
  finance_task_status: string | null;
  finance_notes: string | null;
  owner_company_name: string;
  age_days?: number;
  credit_note_for_id?: string | null;
}

export interface DbInvoiceRequiredJob {
  id: string;
  completed_at: string;
  owner_company_name: string;
  system_type: string;
  coverage_area: string;
  assigned_technician_name: string;
}

export interface DbLinkableJob {
  id: string;
  site_id: string;
  coverage_area: string;
  status: string;
  scheduled_date: string | null;
}

// ─── Session / API types ────────────────────────────────────────────────────

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteId: string | null;
  forcePasswordChange: boolean;
  mfaRequired: boolean;
  mfaEnabled: boolean;
  expiresAt: string;
}

export type ApiOk<T extends Record<string, unknown> = Record<string, unknown>> = { ok: true } & T;
export type ApiFail = { ok: false; message: string };
export type ApiResponse<T extends Record<string, unknown> = Record<string, unknown>> =
  | ApiOk<T>
  | ApiFail;
