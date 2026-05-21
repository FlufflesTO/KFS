import { env } from "cloudflare:workers";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const issuer = "Kharon Portal";

function base64UrlEncode(bytes) {
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

function getMfaSecret() {
  const secret = env.MFA_SECRET || env.SESSION_SECRET || env.AUTH_SECRET || "";
  if (secret.length < 32) {
    throw new Error("MFA_SECRET or SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

async function encryptionKey() {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(getMfaSecret()));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptMfaSecret(secret) {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), encoder.encode(secret));
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

export async function decryptMfaSecret(value) {
  if (!value || !value.includes(".")) return null;
  const [encodedIv, encodedData] = value.split(".");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlDecode(encodedIv) },
    await encryptionKey(),
    base64UrlDecode(encodedData)
  );
  return decoder.decode(decrypted);
}

export function generateTotpSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");

  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += base32Alphabet[parseInt(chunk, 2)];
  }
  return output;
}

function base32Decode(secret) {
  const normalized = String(secret || "").replaceAll(" ", "").toUpperCase();
  let bits = "";
  for (const char of normalized) {
    const value = base32Alphabet.indexOf(char);
    if (value === -1) throw new Error("Invalid MFA secret.");
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function hotp(secret, counter) {
  const key = await crypto.subtle.importKey("raw", base32Decode(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter, false);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer));
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

function constantTimeEqual(left, right) {
  const leftBytes = encoder.encode(String(left));
  const rightBytes = encoder.encode(String(right));
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  return diff === 0;
}

export async function verifyTotpCode(secret, code, options = {}) {
  const cleaned = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;

  const period = options.period || 30;
  const window = options.window || 1;
  const currentCounter = Math.floor(Date.now() / 1000 / period);
  for (let offset = -window; offset <= window; offset += 1) {
    if (constantTimeEqual(await hotp(secret, currentCounter + offset), cleaned)) return true;
  }
  return false;
}

export function mfaProvisioningUri(user, secret) {
  const label = encodeURIComponent(`${issuer}:${user.email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
