/**
 * Project Sentinel - Request Utilities
 * Purpose: Handles IP address extraction and geolocation resolution from client requests
 * Dependencies: ./bindings-auth.ts
 * Structural Role: Client identification utilities
 */

import { resolveBindingsForAuth } from "./bindings-auth.js";

const textEncoder = new TextEncoder();

async function sha256Text(input: string): Promise<string> {
  const uint8 = textEncoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", uint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function base64Encode(input: string | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : textEncoder.encode(String(input));
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary);
}

export function clientIp(request: Request): string | null {
  // @ts-ignore - cf object is available in Cloudflare Workers
  const cf = request.cf as { country?: string; city?: string; region?: string; regionCode?: string; postalCode?: string; metroCode?: string; continent?: string; timezone?: string; latitude?: number; longitude?: number; };
  // @ts-ignore - headers may contain cf-connecting-ip
  return request.headers.get("cf-connecting-ip") || cf?.ip || null;
}

export function clientLocation(request: Request): { country?: string; city?: string; region?: string; regionCode?: string; postalCode?: string; metroCode?: string; continent?: string; timezone?: string; latitude?: number; longitude?: number; } | null {
  // @ts-ignore - cf object is available in Cloudflare Workers
  const cf = request.cf as { country?: string; city?: string; region?: string; regionCode?: string; postalCode?: string; metroCode?: string; continent?: string; timezone?: string; latitude?: number; longitude?: number; };
  if (!cf) return null;
  
  // Explicitly construct the return object to satisfy exactOptionalPropertyTypes
  const result: { country?: string; city?: string; region?: string; regionCode?: string; postalCode?: string; metroCode?: string; continent?: string; timezone?: string; latitude?: number; longitude?: number; } = {};
  
  if (cf.country !== undefined) result.country = cf.country;
  if (cf.city !== undefined) result.city = cf.city;
  if (cf.region !== undefined) result.region = cf.region;
  if (cf.regionCode !== undefined) result.regionCode = cf.regionCode;
  if (cf.postalCode !== undefined) result.postalCode = cf.postalCode;
  if (cf.metroCode !== undefined) result.metroCode = cf.metroCode;
  if (cf.continent !== undefined) result.continent = cf.continent;
  if (cf.timezone !== undefined) result.timezone = cf.timezone;
  if (cf.latitude !== undefined) result.latitude = cf.latitude;
  if (cf.longitude !== undefined) result.longitude = cf.longitude;
  
  return result;
}

export async function clientFingerprint(request: Request): Promise<string> {
  const ip = clientIp(request) || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const acceptLanguage = request.headers.get("accept-language") || "unknown";
  const acceptEncoding = request.headers.get("accept-encoding") || "unknown";

  const bindings = resolveBindingsForAuth();
  const secret = String(bindings.FINGERPRINT_SECRET || bindings.SESSION_SECRET || bindings.AUTH_SECRET || "default-secret");
  const hashedIp = await sha256Text(ip);
  const combined = `${hashedIp}|${userAgent}|${acceptLanguage}|${acceptEncoding}|${secret}`;

  return sha256Text(combined);
}

export { sha256Text };

// Export the function that was previously missing
export async function requestFingerprint(request: Request): Promise<string> {
  return clientFingerprint(request);
}

