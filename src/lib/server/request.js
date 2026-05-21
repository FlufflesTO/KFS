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
