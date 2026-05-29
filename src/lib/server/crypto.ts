/**
 * Project Sentinel - Cryptography Services
 * Purpose: Provides application-level encryption and decryption for sensitive data at rest
 * Dependencies: Web Crypto API
 * Structural Role: Security utility
 */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getEncryptionKey(env: Record<string, unknown>): string {
  const secret = String(env.ENCRYPTION_SECRET || "");
  if (secret.length < 32) {
    throw new Error("Encryption requires a dedicated ENCRYPTION_SECRET of at least 32 characters.");
  }
  return secret;
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: textEncoder.encode("kharon-storage-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts a plain text string using AES-GCM
 */
export async function encryptText(text: string, env: Record<string, unknown>): Promise<string> {
  if (!text) return text;
  const key = await deriveAesKey(getEncryptionKey(env));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = textEncoder.encode(text);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  
  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const cipherBase64 = arrayBufferToBase64(ciphertext);
  return `${ivBase64}:${cipherBase64}`;
}

/**
 * Decrypts an AES-GCM encrypted string (format: base64(iv):base64(ciphertext))
 */
export async function decryptText(encrypted: string, env: Record<string, unknown>): Promise<string> {
  if (!encrypted || !encrypted.includes(":")) return encrypted; // Return as-is if not encrypted format
  try {
    const [ivBase64, cipherBase64] = encrypted.split(":");
    if (!ivBase64 || !cipherBase64) return encrypted;

    const key = await deriveAesKey(getEncryptionKey(env));
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const ciphertext = base64ToArrayBuffer(cipherBase64);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return textDecoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed", error);
    throw new Error("Failed to decrypt sensitive data.");
  }
}
