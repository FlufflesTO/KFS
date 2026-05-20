import { env } from "cloudflare:workers";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const sessionDurationSeconds = 60 * 60 * 12;
export const sessionCookieName = "kharon_session_token";

function base64UrlEncode(input) {
  const bytes = input instanceof Uint8Array ? input : textEncoder.encode(String(input));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(input) {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function getSessionSecret() {
  const secret = env.SESSION_SECRET || env.AUTH_SECRET || "";
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function assertRole(role) {
  if (!["tech", "admin", "client", "finance"].includes(role)) {
    throw new Error("Invalid role in session payload.");
  }
}

export async function createSessionToken(user) {
  assertRole(user.role);

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user.id),
    name: String(user.name),
    email: String(user.email),
    role: user.role,
    siteId: user.site_id || null,
    iat: issuedAt,
    exp: issuedAt + sessionDurationSeconds
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(getSessionSecret()), textEncoder.encode(encodedPayload));

  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const expected = base64UrlDecode(encodedSignature);
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(getSessionSecret()),
    expected,
    textEncoder.encode(encodedPayload)
  );

  if (!valid) return null;

  const payload = JSON.parse(textDecoder.decode(base64UrlDecode(encodedPayload)));
  assertRole(payload.role);

  if (!payload.sub || !payload.name || !payload.email || !payload.exp) return null;
  if (Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;

  return {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    siteId: payload.siteId || null,
    expiresAt: new Date(Number(payload.exp) * 1000).toISOString()
  };
}

export function sessionCookie(token) {
  const secure = env.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${sessionCookieName}=${token}; Path=/portal; HttpOnly;${secure} SameSite=Strict; Max-Age=${sessionDurationSeconds}`;
}

export async function hashPassword(password, salt = crypto.randomUUID()) {
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const iterations = 210000;
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

export async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;

  const [scheme, iterationsText, encodedSalt, encodedHash] = storedHash.split("$");
  if (scheme !== "pbkdf2_sha256" || !iterationsText || !encodedSalt || !encodedHash) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;

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

function constantTimeEqual(left, right) {
  const leftBytes = textEncoder.encode(left);
  const rightBytes = textEncoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return diff === 0;
}
