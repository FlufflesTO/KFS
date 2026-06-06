/**
 * Project Sentinel - Access and Authorization Control Services
 * Purpose: Provides role-based access checks (admin, finance) and client site access validations
 * Dependencies: ./http.ts, ./auth.ts, @cloudflare/workers-types
 * Structural Role: Access control and authorization verification layer
 */

import type { D1Database } from "@cloudflare/workers-types";
import { forbidden } from "./http.ts";

export interface AccessUser {
  id: string;
  role: "tech" | "admin" | "client" | "finance" | "manager";
  site_id?: string | null;
  siteId?: string | null;
}

export interface ClientSite {
  id: string;
  owner_company_name: string;
  physical_address: string;
  site_contact_person: string;
  site_contact_email: string;
  site_contact_phone: string;
}

export function requireAdmin(user: AccessUser | null | undefined): Response | null {
  if (!user || user.role !== "admin") {
    return forbidden("Only admin accounts can perform this action.");
  }
  return null;
}

export function requireFinance(user: AccessUser | null | undefined): Response | null {
  if (!user || (user.role !== "finance" && user.role !== "admin")) {
    return forbidden("Only finance or admin accounts can perform this action.");
  }
  return null;
}

export function requireAdminOrFinance(user: AccessUser | null | undefined): Response | null {
  return requireFinance(user);
}

export function requireManager(user: AccessUser | null | undefined): Response | null {
  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return forbidden("Only manager or admin accounts can perform this action.");
  }
  return null;
}

export function requireAdminOrManager(user: AccessUser | null | undefined): Response | null {
  return requireManager(user);
}

export async function clientSiteIds(db: D1Database, user: AccessUser | null | undefined): Promise<string[]> {
  if (!user || user.role !== "client") return [];

  const ids = new Set<string>();
  const explicitSiteId = user.site_id || user.siteId;
  if (explicitSiteId) ids.add(String(explicitSiteId));

  let rows: Array<{ site_id: string | null }> = [];
  try {
    const result = await db
      .prepare(
        `SELECT site_id
         FROM client_site_access
         WHERE user_id = ?1`
      )
      .bind(user.id)
      .all();
    rows = (result.results as Array<{ site_id: string | null }>) || [];
  } catch (error) {
    console.error("client site access mapping load failed", error);
  }

  for (const row of rows) {
    if (row.site_id) ids.add(String(row.site_id));
  }

  return [...ids];
}

export async function clientSites(db: D1Database, user: AccessUser | null | undefined): Promise<ClientSite[]> {
  const ids = await clientSiteIds(db, user);
  if (ids.length === 0) return [];

  const placeholders = ids.map((_, index) => `?${index + 1}`).join(", ");
  const result = await db
    .prepare(
      `SELECT id, owner_company_name, physical_address, site_contact_person, site_contact_email, site_contact_phone
       FROM sites
       WHERE id IN (${placeholders})
       ORDER BY owner_company_name ASC`
    )
    .bind(...ids)
    .all();
  return (result.results as unknown as ClientSite[]) || [];
}

export async function clientCanAccessSite(db: D1Database, user: AccessUser | null | undefined, siteId: string | null | undefined): Promise<boolean> {
  if (!siteId) return false;
  const ids = await clientSiteIds(db, user);
  return ids.includes(String(siteId));
}

/**
 * Validates that a client user can access the requested site.
 * Returns 403 Forbidden if access is not permitted.
 * For non-client users, returns null (no restriction).
 */
export async function requireClientSiteAccess(
  db: D1Database,
  user: AccessUser | null | undefined,
  siteId: string | null | undefined
): Promise<Response | null> {
  if (!user) return forbidden("Authentication required.");
  if (user.role !== "client") return null; // Non-clients bypass this check

  const canAccess = await clientCanAccessSite(db, user, siteId);
  if (!canAccess) {
    return forbidden("You do not have access to this site.");
  }
  return null;
}

/**
 * Validates data access for tenant accounts.
 * Ensures client users can only query data from their authorized sites.
 * Returns filtered site IDs or empty array if no access.
 */
export async function validateDataAccess(
  db: D1Database,
  user: AccessUser | null | undefined,
  requestedSiteIds: string[]
): Promise<string[]> {
  if (!user) return [];
  if (user.role === "admin") return requestedSiteIds; // Admins can access all

  const authorizedIds = await clientSiteIds(db, user);
  // Return only the intersection of requested and authorized sites
  return requestedSiteIds.filter(id => authorizedIds.includes(String(id)));
}

export function inClause(values: unknown[], startIndex: number = 1): string {
  return values.map((_, index) => `?${startIndex + index}`).join(", ");
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export interface CleanTextOptions {
  min?: number;
  max?: number;
  required?: boolean;
}

export function cleanText(value: unknown, fieldName: string, options: CleanTextOptions = {}): string {
  const min = options.min ?? 0;
  const max = options.max ?? 500;
  const required = options.required ?? true;
  const text = String(value || "").trim();

  if (!text && !required) return "";
  if (text.length < min || text.length > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max} characters.`);
  }

  return text;
}

export interface CleanIdOptions {
  required?: boolean;
}

export function cleanId(value: unknown, fieldName: string, options: CleanIdOptions = {}): string | null {
  const required = options.required ?? true;
  const id = String(value || "").trim();
  if (!id && !required) return null;
  if (!/^[A-Za-z0-9_-]{3,120}$/.test(id)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return id;
}

export interface CleanEmailOptions {
  required?: boolean;
}

export function cleanEmail(value: unknown, fieldName: string, options: CleanEmailOptions = {}): string | null {
  const required = options.required ?? true;
  const email = String(value || "").trim().toLowerCase();
  if (!email && !required) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 160) {
    throw new Error(`${fieldName} must be a valid email address.`);
  }
  return email;
}

export function cleanDate(value: unknown, fieldName: string): string {
  const date = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format.`);
  }
  return date;
}

export function cleanChoice(value: unknown, fieldName: string, allowed: string[]): string {
  const choice = String(value || "").trim();
  if (!allowed.includes(choice)) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return choice;
}

export function cleanBoolean(value: unknown): number {
  return value === true || value === 1 || value === "1" || value === "true" ? 1 : 0;
}

export interface CleanIntOptions {
  min?: number;
  max?: number;
  fallback?: number | null;
}

export function cleanInt(value: unknown, fieldName: string, options: CleanIntOptions = {}): number {
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  const fallback = options.fallback ?? null;
  const raw = value === null || value === undefined || value === "" ? null : Number(value);
  if (raw === null && fallback !== null && fallback !== undefined) {
    return fallback;
  }
  if (raw === null || !Number.isInteger(raw) || raw < min || raw > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}.`);
  }
  return raw;
}

