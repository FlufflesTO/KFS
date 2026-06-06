/**
 * Project Sentinel - CSRF Protection Utilities
 * Purpose: Generates, formats, and verifies client-side CSRF tokens and cookies
 * Dependencies: ./bindings-auth.ts
 * Structural Role: Cross-Site Request Forgery mitigation layer
 */

import { resolveBindingsForAuth } from "./bindings-auth.js";
import type { SessionUser } from "./auth";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const csrfDurationSeconds = 60 * 60 * 12;
export const csrfCookieName = "kharon_csrf_token";

interface CsrfPayload {
  sub: string;
  nonce: string;
  iat: number;
  exp: number;
}

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

function getSecret(): string {
  const bindings = resolveBindingsForAuth();
  const secret = String(bindings.CSRF_SECRET || bindings.ENCRYPTION_SECRET || bindings.SESSION_SECRET || bindings.AUTH_SECRET || "");
  if (secret.length < 32) {
    throw new Error("CSRF_SECRET or SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", textEncoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createCsrfToken(user: SessionUser): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const payload: CsrfPayload = {
    sub: String(user.id),
    nonce,
    iat: issuedAt,
    exp: issuedAt + csrfDurationSeconds
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), textEncoder.encode(encodedPayload));
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyCsrfToken(token: string | null | undefined, user: SessionUser): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  try {
    const [encodedPayload, encodedSignature] = token.split(".");
    if (!encodedPayload || !encodedSignature) return false;

    // Explicitly cast to ArrayBuffer to satisfy TypeScript
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      base64UrlDecode(encodedSignature).buffer as ArrayBuffer,
      textEncoder.encode(encodedPayload)
    );
    if (!valid) return false;

    const payload = JSON.parse(textDecoder.decode(base64UrlDecode(encodedPayload))) as CsrfPayload;
    if (payload.sub !== String(user.id) || !payload.exp) return false;
    return Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function verifyCsrfRequest(request: Request, user: SessionUser): Promise<boolean> {
  const submittedToken = request.headers.get("x-csrf-token");
  return verifyCsrfToken(submittedToken, user);
}

function escapeAttribute(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function csrfHiddenInput(token: string): string {
  return `<input type="hidden" name="csrfToken" value="${escapeAttribute(token)}">`;
}

export function csrfMetaTag(token: string): string {
  return `<meta name="kharon-csrf-token" content="${escapeAttribute(token)}">`;
}

export function csrfErrorResponse(): Response {
  return new Response(JSON.stringify({ ok: false, message: "Security token is missing or invalid." }), {
    status: 403,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function csrfCookie(token: string): string {
  const bindings = resolveBindingsForAuth();
  const secure = bindings.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${csrfCookieName}=${token}; Path=/portal;${secure} SameSite=Strict; Max-Age=${csrfDurationSeconds}`;
}

export function expiredCsrfCookie(): string {
  const bindings = resolveBindingsForAuth();
  const secure = bindings.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${csrfCookieName}=; Path=/portal;${secure} SameSite=Strict; Max-Age=0`;
}
