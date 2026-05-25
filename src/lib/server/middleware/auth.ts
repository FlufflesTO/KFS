import { getDatabase } from "../bindings";
import { verifyCsrfToken } from "./csrf";

export interface AuthResult {
  user: any;
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
    // Verify session exists and is not expired
    const session = await db.prepare(
      `SELECT user_id, expires_at, csrf_token, created_at FROM sessions WHERE id = ?1 AND expires_at > datetime('now')`
    ).bind(sessionId).first();
    
    if (!session) {
      return { user: null, isValid: false, error: "Invalid or expired session" };
    }

    // Verify CSRF token for non-GET requests
    if (request.method !== "GET") {
      const csrfToken = request.headers.get("x-csrf-token");
      if (!csrfToken || !verifyCsrfToken(csrfToken, session.csrf_token)) {
        return { user: null, isValid: false, error: "Invalid CSRF token" };
      }
    }

    // Fetch user details
    const user = await db.prepare(
      `SELECT id, email, name, role, is_active, mfa_secret_encrypted FROM users WHERE id = ?1 AND is_active = 1`
    ).bind(session.user_id).first();
    
    if (!user) {
      return { user: null, isValid: false, error: "User no longer exists" };
    }

    // Check role requirement
    if (requiredRole && user.role !== requiredRole) {
      return { user: user, isValid: false, error: `Insufficient permissions. Required: ${requiredRole}` };
    }

    // Check MFA requirement - NOW INCLUDING TECHNICIAN ROLE
    if (requiresMFA(user.role) && !isMFAVerified(request)) {
      return { user: user, isValid: false, error: "MFA verification required" };
    }

    return { user, isValid: true };
  } catch (error) {
    console.error("authentication failed", error);
    return { user: null, isValid: false, error: "Authentication failed" };
  }
}

// Updated to include technician role in MFA enforcement
export function requiresMFA(role: string): boolean {
  return ["admin", "finance", "tech"].includes(role); // Added tech role
}

function isMFAVerified(request: Request): boolean {
  // Implementation for checking if MFA has been verified in current session
  // This would typically check a separate MFA verification flag in the session
  return true; // Placeholder - actual implementation would check MFA verification status
}