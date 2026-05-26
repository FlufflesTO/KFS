const textEncoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function userAgent(request: Request): string {
  return String(request.headers.get("user-agent") || "").slice(0, 400);
}

export async function sha256Text(value: string | null | undefined): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(String(value || "")));
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Perform a fetch request with exponential backoff retry logic.
 * Used for external API integrations to prevent silent failures.
 */
export async function fetchWithBackoff(url: string | URL, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
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
      if (attempt >= maxRetries) {
        throw new Error(`External API request failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw new Error("fetchWithBackoff failed unexpectedly.");
}

export interface RequestFingerprint {
  ipHash: string;
  subjectHash: string;
  userAgent: string;
}

export async function requestFingerprint(request: Request, subject: string = ""): Promise<RequestFingerprint> {
  const ip = clientIp(request);
  const ipHash = await sha256Text(ip);
  const subjectHash = subject ? await sha256Text(subject.toLowerCase()) : "anonymous";
  return {
    ipHash,
    subjectHash,
    userAgent: userAgent(request)
  };
}
