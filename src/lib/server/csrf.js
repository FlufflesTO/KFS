import { env } from "cloudflare:workers";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const csrfDurationSeconds = 60 * 60 * 12;
export const csrfCookieName = "kharon_csrf_token";

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

function getSecret() {
  const secret = env.SESSION_SECRET || env.AUTH_SECRET || "";
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

async function hmacKey() {
  return crypto.subtle.importKey("raw", textEncoder.encode(getSecret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createCsrfToken(user) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    sub: String(user.id),
    nonce: crypto.randomUUID(),
    iat: issuedAt,
    exp: issuedAt + csrfDurationSeconds
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), textEncoder.encode(encodedPayload));
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyCsrfToken(token, user) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return false;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(),
    base64UrlDecode(encodedSignature),
    textEncoder.encode(encodedPayload)
  );
  if (!valid) return false;

  const payload = JSON.parse(textDecoder.decode(base64UrlDecode(encodedPayload)));
  if (payload.sub !== String(user.id) || !payload.exp) return false;
  return Number(payload.exp) > Math.floor(Date.now() / 1000);
}

export function csrfCookie(token) {
  const secure = env.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${csrfCookieName}=${token}; Path=/portal;${secure} SameSite=Strict; Max-Age=${csrfDurationSeconds}`;
}

export function expiredCsrfCookie() {
  const secure = env.ENVIRONMENT === "local" ? "" : " Secure;";
  return `${csrfCookieName}=; Path=/portal;${secure} SameSite=Strict; Max-Age=0`;
}
