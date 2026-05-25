import { getDatabase } from "./bindings";

// 8 hours in milliseconds for absolute timeout
const ABSOLUTE_SESSION_TIMEOUT = 8 * 60 * 60 * 1000;

export interface SessionData {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  csrfToken: string;
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const session = await db.prepare(
      `SELECT id, user_id, expires_at, created_at, csrf_token FROM sessions WHERE id = ?1`
    ).bind(sessionId).first();
    
    if (!session) {
      return false;
    }

    // Check if session has expired normally
    if (new Date(session.expires_at) < new Date()) {
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

    return true;
  } catch (error) {
    console.error("session validation failed", error);
    return false;
  }
}

export async function createSession(userId: string, csrfToken: string): Promise<string> {
  const db = getDatabase();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 12); // 12-hour sliding window
  
  try {
    await db.prepare(
      `INSERT INTO sessions (id, user_id, expires_at, created_at, csrf_token) VALUES (?1, ?2, ?3, datetime('now'), ?4)`
    ).bind(sessionId, userId, expiresAt.toISOString(), csrfToken).run();
    
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
      `UPDATE sessions SET expires_at = ?2 WHERE id = ?1 AND expires_at > datetime('now')`
    ).bind(sessionId, newExpiresAt.toISOString()).run();
  } catch (error) {
    console.error("session extension failed", error);
    throw error;
  }
}

// New function to check if session is approaching absolute timeout
export async function getSessionTimeoutInfo(sessionId: string): Promise<{ 
  timeRemaining: number; 
  isApproachingTimeout: boolean; 
  absoluteTimeout: boolean 
}> {
  const db = getDatabase();
  
  try {
    const session = await db.prepare(
      `SELECT created_at FROM sessions WHERE id = ?1`
    ).bind(sessionId).first();
    
    if (!session) {
      return { timeRemaining: 0, isApproachingTimeout: true, absoluteTimeout: true };
    }

    const createdAt = new Date(session.created_at);
    const now = new Date();
    const timeElapsed = now.getTime() - createdAt.getTime();
    const timeRemaining = ABSOLUTE_SESSION_TIMEOUT - timeElapsed;
    const isApproachingTimeout = timeRemaining < (60 * 60 * 1000); // Within 1 hour of timeout
    
    return {
      timeRemaining,
      isApproachingTimeout,
      absoluteTimeout: timeElapsed >= ABSOLUTE_SESSION_TIMEOUT
    };
  } catch (error) {
    console.error("session timeout info failed", error);
    return { timeRemaining: 0, isApproachingTimeout: true, absoluteTimeout: true };
  }
}