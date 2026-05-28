/**
 * Project Sentinel - Request Authentication Middleware
 * Purpose: Handles session verification, CSRF checking, and MFA checks for API endpoints
 * Dependencies: ../bindings.ts, ../csrf.ts, ../auth.ts
 * Structural Role: HTTP authentication middleware layer
 */

import { getDatabase } from "../bindings";
import { verifyCsrfToken } from "../csrf.js";
import type { SessionUser } from "../auth.js";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: number;
  mfa_secret_encrypted?: string | null;
}

export interface AuthResult {
  user: AuthUser | null;
  isValid: boolean;
  error?: string;
}

export async function authenticateRequest(request: Request, requiredRole?: string): Promise<AuthResult> {
  // Extract session cookie
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return { user: null, isValid: false, error: "No session cookie" };
  }

  const sessionMatch = cookieHeader.match(/kharon_session=([^;]+)/);
  if (!sessionMatch) {
    return { user: null, isValid: false, error: "No session cookie" };
  }

  const sessionId = sessionMatch[1];
  const db = getDatabase();

  try {
    interface SessionRow {
      user_id: string;
      expires_at: string;
      csrf_token: string;
      created_at: string;
      mfa_verified: number | null;
    }

    // Verify session exists and is not expired
    const session = (await db.prepare(
      `SELECT user_id, expires_at, csrf_token, created_at, mfa_verified FROM sessions WHERE id = ?1 AND expires_at > datetime('now')`
    ).bind(sessionId).first()) as SessionRow | null;
    
    if (!session) {
      return { user: null, isValid: false, error: "Invalid or expired session" };
    }

    // Fetch user details
    const user = (await db.prepare(
      `SELECT id, email, name, role, is_active, mfa_secret_encrypted FROM users WHERE id = ?1 AND is_active = 1`
    ).bind(session.user_id).first()) as AuthUser | null;
    
    if (!user) {
      return { user: null, isValid: false, error: "User no longer exists" };
    }

    // Verify CSRF token for non-GET requests
    if (request.method !== "GET") {
      const csrfToken = request.headers.get("x-csrf-token");
      const sessionUser: SessionUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "tech" | "admin" | "client" | "finance"
      };
      if (!csrfToken || !(await verifyCsrfToken(csrfToken, sessionUser))) {
        return { user: null, isValid: false, error: "Invalid CSRF token" };
      }
    }

    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
      return { user: user, isValid: false, error: `Insufficient permissions. Required: ${requiredRole}` };
    }

    // Check MFA requirement - NOW INCLUDING TECHNICIAN ROLE
    if (requiresMFA(user.role) && !isMFAVerified(session)) {
      return { user: user, isValid: false, error: "MFA verification required" };
    }

    return { user, isValid: true };
  } catch (error) {
    console.error("authentication failed", error);
    return { user: null, isValid: false, error: "Authentication failed" };
  }
}

// Check if user is logged in (without role requirement)
export async function isLoggedIn(request: Request): Promise<boolean> {
  const result = await authenticateRequest(request);
  return result.isValid && result.user !== null;
}

// Updated to include technician role in MFA enforcement
export function requiresMFA(role: string): boolean {
  return ["admin", "finance", "tech"].includes(role); // Added tech role
}

function isMFAVerified(session: { mfa_verified?: number | boolean | null } | null | undefined): boolean {
  return Boolean(session && (session.mfa_verified === 1 || session.mfa_verified === true));
}