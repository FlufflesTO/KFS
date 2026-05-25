import { getDatabase } from "./bindings";

// 8 hours in milliseconds for absolute timeout
const ABSOLUTE_SESSION_TIMEOUT = 8 * 60 * 60 * 1000;
// 30 minutes for inactivity timeout
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export interface SessionData {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  csrfToken: string;
  lastActivity: string;
  userAgent?: string;
  ipHash?: string;
}

export async function validateSession(sessionId: string, userAgent?: string, ip?: string): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const session = await db.prepare(
      `SELECT id, user_id, expires_at, created_at, csrf_token, last_activity, user_agent_hash, ip_hash FROM sessions WHERE id = ?1`
    ).bind(sessionId).first();
    
    if (!session) {
      return false;
    }

    // Check if session has expired normally
    if (new Date(session.expires_at) < new Date()) {
      await revokeSession(sessionId);
      return false;
    }

    // Check absolute timeout (created_at + 8 hours)
    const createdAt = new Date(session.created_at);
    const now = new Date();
    const timeElapsed = now.getTime() - createdAt.getTime();
    
    if (timeElapsed > ABSOLUTE_SESSION_TIMEOUT) {
      // Session has exceeded absolute timeout, should be revoked
      await revokeSession(sessionId);
      return false;
    }

    // Check inactivity timeout
    const lastActivity = new Date(session.last_activity);
    const activityTimeElapsed = now.getTime() - lastActivity.getTime();
    
    if (activityTimeElapsed > INACTIVITY_TIMEOUT) {
      await revokeSession(sessionId);
      return false;
    }

    // Check for session hijacking attempts
    if (userAgent && session.user_agent_hash) {
      const currentUAHash = await hashString(userAgent);
      if (currentUAHash !== session.user_agent_hash) {
        console.warn(`Session user agent mismatch for session ${sessionId}`);
        await revokeSession(sessionId);
        return false;
      }
    }

    if (ip && session.ip_hash) {
      const currentIPHash = await hashString(ip);
      if (currentIPHash !== session.ip_hash) {
        console.warn(`Session IP mismatch for session ${sessionId}`);
        await revokeSession(sessionId);
        return false;
      }
    }

    // Update last activity
    await updateLastActivity(sessionId);

    return true;
  } catch (error) {
    console.error("session validation failed", error);
    return false;
  }
}

export async function createSession(userId: string, csrfToken: string, userAgent?: string, ip?: string): Promise<string> {
  const db = getDatabase();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12); // 12-hour sliding window
  
  try {
    // Hash sensitive session identifiers
    const userAgentHash = userAgent ? await hashString(userAgent) : null;
    const ipHash = ip ? await hashString(ip) : null;
    
    await db.prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at, last_activity, csrf_token, user_agent_hash, ip_hash) VALUES (?1, ?2, ?3, datetime('now'), datetime('now'), ?4, ?5, ?6)`
    ).bind(sessionId, userId, expiresAt.toISOString(), csrfToken, userAgentHash, ipHash).run();
    
    return sessionId;
  } catch (error) {
    console.error("session creation failed", error);
    throw error;
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.prepare(
      `DELETE FROM sessions WHERE id = ?1`
    ).bind(sessionId).run();
  } catch (error) {
    console.error("session revocation failed", error);
    throw error;
  }
}

export async function extendSession(sessionId: string): Promise<void> {
  const db = getDatabase();
  const newExpiresAt = new Date();
  newExpiresAt.setHours(newExpiresAt.getHours() + 12); // Extend by 12 hours
  
  try {
    await db.prepare(
      `UPDATE sessions SET expires_at = ?2, last_activity = datetime('now') WHERE id = ?1 AND expires_at > datetime('now')`
    ).bind(sessionId, newExpiresAt.toISOString()).run();
  } catch (error) {
    console.error("session extension failed", error);
    throw error;
  }
}

// New function to update last activity
async function updateLastActivity(sessionId: string): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.prepare(
      `UPDATE sessions SET last_activity = datetime('now') WHERE id = ?1`
    ).bind(sessionId).run();
  } catch (error) {
    console.error("last activity update failed", error);
  }
}

// New function to hash strings for session security
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// New function to check if session is approaching absolute timeout
export async function getSessionTimeoutInfo(sessionId: string): Promise<{ 
  timeRemaining: number; 
  isApproachingTimeout: boolean; 
  absoluteTimeout: boolean;
  inactivityTimeout: boolean;
}> {
  const db = getDatabase();
  
  try {
    const session = await db.prepare(
      `SELECT created_at, last_activity FROM sessions WHERE id = ?1`
    ).bind(sessionId).first();
    
    if (!session) {
      return { 
        timeRemaining: 0, 
        isApproachingTimeout: true, 
        absoluteTimeout: true,
        inactivityTimeout: true
      };
    }

    const createdAt = new Date(session.created_at);
    const lastActivity = new Date(session.last_activity);
    const now = new Date();
    
    const timeElapsed = now.getTime() - createdAt.getTime();
    const activityTimeElapsed = now.getTime() - lastActivity.getTime;
    
    const absoluteTimeRemaining = ABSOLUTE_SESSION_TIMEOUT - timeElapsed;
    const inactivityTimeRemaining = INACTIVITY_TIMEOUT - activityTimeElapsed;
    
    const isApproachingTimeout = absoluteTimeRemaining < (60 * 60 * 1000); // Within 1 hour of timeout
    const isApproachingInactivity = inactivityTimeRemaining < (5 * 60 * 1000); // Within 5 minutes of inactivity timeout
    
    return {
      timeRemaining: Math.min(absoluteTimeRemaining, inactivityTimeRemaining),
      isApproachingTimeout,
      absoluteTimeout: timeElapsed >= ABSOLUTE_SESSION_TIMEOUT,
      inactivityTimeout: activityTimeElapsed >= INACTIVITY_TIMEOUT
    };
  } catch (error) {
    console.error("session timeout info failed", error);
    return { 
      timeRemaining: 0, 
      isApproachingTimeout: true, 
      absoluteTimeout: true,
      inactivityTimeout: true
    };
  }
}

// Function to clean up expired sessions periodically
export async function cleanupExpiredSessions(): Promise<number> {
  const db = getDatabase();
  
  try {
    const result = await db.prepare(
      `DELETE FROM sessions WHERE expires_at < datetime('now') OR 
       datetime(last_activity, '+8 hours') < datetime('now') OR
       datetime(created_at, '+8 hours') < datetime('now')`
    ).run();
    
    return result.changes || 0;
  } catch (error) {
    console.error("session cleanup failed", error);
    return 0;
  }
}