/**
 * Project Sentinel - MFA Cryptography & TOTP Services
 * Purpose: Generates, encrypts, decrypts, and verifies TOTP MFA secrets and codes
 * Dependencies: cloudflare:workers
 * Structural Role: MFA cryptography and validation layer
 */

// @ts-ignore - cloudflare:workers module is not available in standard TypeScript definitions
import { env } from "cloudflare:workers";

import QRCode from "qrcode";
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const issuer = "Kharon Portal";

interface MfaOptions {
  period?: number;
  window?: number;
}

export async function generateMfaQrCode(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri, {
      margin: 2,
      width: 280,
      color: {
        dark: "#0b0d0f",
        light: "#ffffff"
      }
    });
  } catch (err) {
    console.error("QR Code generation failed:", err);
    throw new Error("Failed to generate MFA QR code");
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
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
  for (let index = 0; index < binary.length; index += 1) {
    const char = binary.charCodeAt(index);
    bytes[index] = char;
  }
  return bytes;
}

function getMfaSecret(): string {
  // @ts-ignore
  const secret = String(env.MFA_SECRET || env.ENCRYPTION_SECRET || "");
  if (secret.length < 32) {
    throw new Error("MFA_SECRET or ENCRYPTION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

async function encryptionKey(): Promise<CryptoKey> {
  const secretBytes = encoder.encode(getMfaSecret());
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  const keyMaterial = new Uint8Array(digest);
  return crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptMfaSecret(secret: string): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const secretBytes = encoder.encode(secret);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), secretBytes);
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

export async function decryptMfaSecret(value: string | null | undefined): Promise<string | null> {
  if (!value || !value.includes(".")) return null;
  const [encodedIv, encodedData] = value.split(".");
  if (!encodedIv || !encodedData) return null;
  const ivBuffer = base64UrlDecode(encodedIv);
  const dataBuffer = base64UrlDecode(encodedData);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    await encryptionKey(),
    new Uint8Array(dataBuffer)
  );
  return decoder.decode(decrypted);
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let bits = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      bits += byte.toString(2).padStart(8, "0");
    }
  }

  let output = "";
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    const val = base32Alphabet[parseInt(chunk, 2)];
    if (val !== undefined) {
      output += val;
    }
  }
  return output;
}

function base32Decode(secret: string): Uint8Array {
  const normalized = String(secret || "").replaceAll(" ", "").toUpperCase();
  let bits = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char !== undefined) {
      const value = base32Alphabet.indexOf(char);
      if (value === -1) throw new Error("Invalid MFA secret.");
      bits += value.toString(2).padStart(5, "0");
    }
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function hotp(secret: string, counter: number): Promise<string> {
  const secretBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    "raw", 
    new Uint8Array(secretBytes), 
    { name: "HMAC", hash: "SHA-1" }, 
    false, 
    ["sign"]
  );
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter, false);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer));
  const lastByte = digest[digest.length - 1];
  if (lastByte === undefined) throw new Error("HMAC signature generation failed.");
  const offset = lastByte & 0x0f;
  const d0 = digest[offset];
  const d1 = digest[offset + 1];
  const d2 = digest[offset + 2];
  const d3 = digest[offset + 3];
  if (d0 === undefined || d1 === undefined || d2 === undefined || d3 === undefined) {
    throw new Error("HMAC signature offset reading failed.");
  }
  const code =
    ((d0 & 0x7f) << 24) |
    ((d1 & 0xff) << 16) |
    ((d2 & 0xff) << 8) |
    (d3 & 0xff);
  return String(code % 1000000).padStart(6, "0");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }
  return diff === 0;
}

export async function verifyTotpCode(secret: string, code: string | null | undefined, options: MfaOptions = {}): Promise<boolean> {
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

export function mfaProvisioningUri(user: { email: string }, secret: string): string {
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
