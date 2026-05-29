/**
 * Project Sentinel - Session Authentication Services
 * Purpose: Manages generation, verification, and revocation of HMAC signed session tokens
 * Dependencies: @cloudflare/workers-types
 * Structural Role: Session cryptography and validation layer
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "tech" | "admin" | "client" | "finance";
  site_id?: string | null;
  siteId?: string | null;
  force_password_change?: boolean | number;
  forcePasswordChange?: boolean;
  mfa_required?: boolean | number;
  mfaRequired?: boolean;
  mfa_enabled?: boolean | number;
  mfaEnabled?: boolean;
  expiresAt?: string;
}

interface SessionPayload {
  sub: string;
  name: string;
  email: string;
  role: "tech" | "admin" | "client" | "finance";
  siteId: string | null;
  forcePasswordChange: boolean;
  mfaRequired: boolean;
  mfaEnabled: boolean;
  iat: number;
  exp: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const sessionDurationSeconds = 60 * 60 * 8;
export const sessionCookieName = "kharon_session_token";

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : textEncoder.encode(String(input));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function getSessionSecret(): string {
  // @ts-ignore - env types might not be perfectly aligned with generic runtime
  const bindings = (globalThis as any).__env__ || globalThis;
  const secret = String(bindings.SESSION_SECRET || bindings.AUTH_SECRET || "");
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function assertRole(role: string): asserts role is "tech" | "admin" | "client" | "finance" {
  if (!["tech", "admin", "client", "finance"].includes(role)) {
    throw new Error("Invalid role in session payload.");
  }
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  assertRole(user.role);

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: user.role,
    siteId: user.site_id || user.siteId || null,
    forcePasswordChange: Boolean(user.force_password_change || user.forcePasswordChange),
    mfaRequired: Boolean(user.mfa_required || user.mfaRequired),
    mfaEnabled: Boolean(user.mfa_enabled || user.mfaEnabled),
    iat: issuedAt,
    exp: issuedAt + sessionDurationSeconds
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(getSessionSecret()),
    textEncoder.encode(encodedPayload)
  );

  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | null | undefined): Promise<SessionUser | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expected = base64UrlDecode(encodedSignature);
  // Explicitly cast to ArrayBuffer to satisfy TypeScript
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(getSessionSecret()),
    expected.buffer as ArrayBuffer,
    textEncoder.encode(encodedPayload)
  );

  if (!valid) return null;

  const payload = JSON.parse(textDecoder.decode(base64UrlDecode(encodedPayload))) as SessionPayload;
  assertRole(payload.role);

  if (!payload.sub || !payload.name || !payload.email || !payload.exp || !payload.iat) return null;
  
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (Number(payload.exp) <= nowInSeconds) return null;
  
  // Enforce absolute 8-hour timeout from token creation
  if (nowInSeconds - Number(payload.iat) > sessionDurationSeconds) return null;

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    siteId: payload.siteId || null,
    forcePasswordChange: Boolean(payload.forcePasswordChange),
    mfaRequired: Boolean(payload.mfaRequired),
    mfaEnabled: Boolean(payload.mfaEnabled),
    expiresAt: new Date(Number(payload.exp) * 1000).toISOString()
  };
}

export function sessionCookie(token: string): string {
  // @ts-ignore
  const bindings = (globalThis as any).__env__ || globalThis;
  const secure = bindings.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${sessionCookieName}=${token}; Path=/portal; HttpOnly;${secure} SameSite=Strict; Max-Age=${sessionDurationSeconds}`;
}

export function expiredSessionCookie(): string {
  // @ts-ignore
  const bindings = (globalThis as any).__env__ || globalThis;
  const secure = bindings.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${sessionCookieName}=; Path=/portal; HttpOnly;${secure} SameSite=Strict; Max-Age=0`;
}

export async function tokenFingerprint(token: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", textEncoder.encode(token));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isTokenRevoked(db: D1Database, token: string): Promise<boolean> {
  try {
    const fp = await tokenFingerprint(token);
    const now = Math.floor(Date.now() / 1000);
    const row = await db.prepare(
      "SELECT 1 FROM revoked_sessions WHERE fingerprint = ? AND expires_at > ?"
    ).bind(fp, now).first();
    return row !== null;
  } catch (error) {
    console.error("token revocation check failed", error);
    return false;
  }
}

export async function revokeSessionToken(db: D1Database, token: string): Promise<void> {
  try {
    const fp = await tokenFingerprint(token);
    const now = Math.floor(Date.now() / 1000);
    let expiresAt = now + sessionDurationSeconds;
    const [encodedPayload] = token.split(".");
    if (encodedPayload) {
      try {
        const payload = JSON.parse(textDecoder.decode(base64UrlDecode(encodedPayload))) as SessionPayload;
        if (payload.exp && Number.isInteger(payload.exp)) expiresAt = payload.exp;
      } catch (error) {
        console.error("failed to decode token payload during revocation", error);
      }
    }
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO revoked_sessions (fingerprint, expires_at) VALUES (?, ?)").bind(fp, expiresAt),
      db.prepare("DELETE FROM revoked_sessions WHERE expires_at <= ?").bind(now)
    ]);
  } catch (error) {
    console.error("revokeSessionToken failed", error);
  }
}

export async function hashPassword(password: string, salt?: string): Promise<string> {
  if (!salt) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    salt = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const iterations = 100000;
  const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: textEncoder.encode(salt),
      iterations
    },
    keyMaterial,
    256
  );

  return `pbkdf2_sha256$${iterations}$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(derived))}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;

  const [scheme, iterationsText, encodedSalt, encodedHash] = storedHash.split("$");
  if (scheme !== "pbkdf2_sha256" || !iterationsText || !encodedSalt || !encodedHash) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 10000 || iterations > 100000) return false;

  const salt = textDecoder.decode(base64UrlDecode(encodedSalt));
  const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: textEncoder.encode(salt),
      iterations
    },
    keyMaterial,
    256
  );

  return constantTimeEqual(base64UrlEncode(new Uint8Array(derived)), encodedHash);
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return diff === 0;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function resetTokenExpiry(hours: number = 1): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}