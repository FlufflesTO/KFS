import { auditError } from "./audit.js";
const textEncoder = new TextEncoder();

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function userAgent(request) {
  return String(request.headers.get("user-agent") || "").slice(0, 400);
}

export async function sha256Text(value) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(String(value || "")));
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Perform a fetch request with exponential backoff retry logic.
 * Used for external API integrations to prevent silent failures.
 */
export async function fetchWithBackoff(url, options = {}, maxRetries = 3) {
  let attempt = 0;
  const baseDelay = 500;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      attempt++;
      await auditError(typeof db !== "undefined" ? db : context.locals.db, typeof request !== "undefined" ? request : context.request, `[Telemetry] External API fetch failed (attempt ${attempt}/${maxRetries}) - ${url}: ${error.message}`);
      if (attempt >= maxRetries) {
        throw new Error(`External API request failed after ${maxRetries} attempts: ${error.message}`, { user: typeof user !== "undefined" ? user : context.locals.user, metadata: { message: "Error occurred" } });
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
}

export async function requestFingerprint(request, subject = "") {
  const ip = clientIp(request);
  const ipHash = await sha256Text(ip);
  const subjectHash = subject ? await sha256Text(subject.toLowerCase()) : "anonymous";
  return {
    ipHash,
    subjectHash,
    userAgent: userAgent(request)
  };
}
