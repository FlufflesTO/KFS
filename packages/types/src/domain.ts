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
  system_subtype: string | null;
  serial_number: string | null;
  installation_date: string | null;
  last_service_date: string | null;
  next_due_date: string;
  service_interval_months: number;
  coverage_area: string;
  manufacturer: string | null;
  model_reference: string | null;
  owner_company_name?: string; // Joined from sites table
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type SystemForForms = Pick<
  DbSystem,
  "id" | "system_type" | "coverage_area"
> & { owner_company_name?: string };

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
  completed_date: string | null;
  version: number;
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
  system_id: string;
  job_id: string | null;
  severity: DefectSeverity;
  sans_clause_ref: string | null;
  description: string;
  certificate_blocking: number;
  status: DefectStatus;
  remediation_notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined fields for UI display
  owner_company_name?: string;
  coverage_area?: string;
}

export type CertStatus = "Valid" | "Blocked" | "Expired" | "Revoked";

export interface DbCertificate {
  id: string;
  certificate_type: string;
  issued_date: string;
  expiry_date: string | null;
  status: CertStatus;
  sans_edition: string | null;
  created_at: string;
  system_id: string;
  system_type: string;
  coverage_area: string;
  site_id: string;
  owner_company_name: string;
  job_id: string | null;
  blocking_severity?: string | null;
}

export interface DbFinancialRecord {
  id: string;
  site_id: string;
  job_id: string | null;
  amount: number;
  item_type: string;
  payment_status: string;
  distribution_date: string;
  reference: string | null;
  sage_quote_number: string | null;
  sage_invoice_number: string | null;
  sage_customer_code: string | null;
  sage_amount_ex_vat: number | null;
  sage_vat_amount: number | null;
  sage_payment_reference: string | null;
  finance_task_status: string | null;
  created_at: string;
  updated_at: string;
  owner_company_name: string;
  job_type: string | null;
  sage_due_date?: string;
}

export interface DbInvoiceRequiredJob {
  id: string;
  owner_company_name: string;
  system_type: string;
  coverage_area: string;
  completed_at: string | null;
  assigned_technician_name: string | null;
}

export interface DbLinkableJob {
  id: string;
  system_id: string;
  job_type: string;
  status: string;
  scheduled_date: string;
  completed_date: string | null;
  system_type: string;
  coverage_area: string;
  owner_company_name: string;
}

export interface DbFinanceTask {
  id: string;
  site_id: string;
  job_id: string | null;
  task_type: string;
  amount: number;
  vat_amount: number | null;
  reference: string | null;
  sage_document_ref: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  owner_company_name: string;
  job_type: string | null;
}

export interface DbFinanceSummary {
  pending_tasks: number;
  total_pending_value: number;
  overdue_invoices: number;
  unpaid_amount: number;
}

export interface DbUserFeedback {
  id: string;
  user_id: string | null;
  variant: string;
  page_path: string;
  category: string;
  message: string;
  submitted_at: string;
  status: string;
  user_name: string | null;
  user_email: string | null;
}

// ─── API Payloads & App State ───────────────────────────────────────────────

export interface CurrentUser {
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
