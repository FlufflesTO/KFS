/**
 * Project Sentinel - Shared Cryptographic Utilities
 * Purpose: Provides reusable crypto functions across auth, mfa, csrf, and audit modules
 * Dependencies: None (uses Web Crypto API)
 * Structural Role: Centralized crypto utilities to avoid code duplication
 */

const textEncoder = new TextEncoder();

/**
 * Encodes input to base64url format (URL-safe base64 without padding).
 * @param input - String or Uint8Array to encode
 * @returns Base64url-encoded string
 */
export function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : textEncoder.encode(String(input));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decodes base64url-encoded string back to Uint8Array.
 * @param input - Base64url-encoded string
 * @returns Decoded Uint8Array
 */
export function base64UrlDecode(input: string): Uint8Array {
  // Add padding if necessary
  let padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  padded += "=".repeat(pad);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a cryptographically secure random hex string.
 * @param bytes - Number of random bytes to generate (default: 16)
 * @returns Hex-encoded random string
 */
export function randomHex(bytes: number = 16): string {
  const randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generates a cryptographically secure random base64url string.
 * @param bytes - Number of random bytes to generate (default: 32)
 * @returns Base64url-encoded random string
 */
export function randomBase64Url(bytes: number = 32): string {
  const randomBytes = new Uint8Array(bytes);
  crypto.getRandomValues(randomBytes);
  return base64UrlEncode(randomBytes);
}

/**
 * Computes SHA-256 hash of input text.
 * @param text - Input text to hash
 * @returns Hex-encoded SHA-256 hash
 */
export async function sha256Text(text: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", textEncoder.encode(text));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Timing-safe comparison of two strings to prevent timing attacks.
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal, false otherwise
 */
export function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = textEncoder.encode(a);
  const bBytes = textEncoder.encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}
