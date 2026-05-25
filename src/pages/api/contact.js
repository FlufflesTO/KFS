import { getDatabase } from "../../lib/server/bindings.js";
import { cleanText, cleanEmail } from "../../lib/server/admin.js";
import { consumeRateLimit } from "../../lib/server/rateLimit.js";
import { sha256Text } from "../../lib/server/request.js";

export const prerender = false;

const ALLOWED_REQUEST_TYPES = new Set([
  // Main contact form options
  "Emergency technical support",
  "Gas suppression evaluation",
  "Fire detection system review",
  "Compliance inspection",
  "Maintenance assessment",
  "Client records access",
  // Solution link labels
  "Gas Suppression",
  "Fire Detection",
  "Compliance & Maintenance",
  "Critical Infrastructure",
  "Integrated Security",
  // Contextual inquiry form types (one per public service/solution page)
  "Gas suppression assessment",
  "Fire detection review",
  "Compliance assessment",
  "Critical infrastructure protection discussion",
  "Emergency / SLA support",
  "Capability discussion",
  "Sector protection assessment",
  "Integrated infrastructure security review"
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function POST({ request }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  if (body.website) {
    return json({ ok: true });
  }

  let name, email, requestType, message;
  try {
    name = cleanText(body.name, "Name", { min: 2, max: 80 });
    email = cleanEmail(body.email, "Email");
    requestType = cleanText(body.requestType, "Request type", { min: 2, max: 120 });
    if (!ALLOWED_REQUEST_TYPES.has(requestType)) throw new Error("Invalid request type.");
    message = cleanText(body.message, "Message", { min: 10, max: 3000 });
  } catch (error) {
    return json({ ok: false, message: error.message }, 422);
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const ipHash = await sha256Text(ip);

  let db;
  try {
    db = getDatabase();
  } catch {
    return json({ ok: false, message: "Service temporarily unavailable." }, 503);
  }

  const limit = await consumeRateLimit(db, request, {
    scope: "public.contact",
    subject: ipHash,
    maxAttempts: 5,
    windowSeconds: 15 * 60
  });
  if (!limit.allowed) {
    return new Response(
      JSON.stringify({ ok: false, message: "Too many submissions. Try again shortly." }),
      {
        status: 429,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "retry-after": String(limit.retryAfter)
        }
      }
    );
  }

  const id = `cq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    await db
      .prepare(
        `INSERT INTO contact_submissions (id, name, email, request_type, message, ip_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(id, name, email, requestType, message, ipHash)
      .run();
  } catch (error) {
    console.error("contact submission failed", error);
    return json(
      { ok: false, message: "Submission could not be saved. Email admin@kharon.co.za directly." },
      500
    );
  }

  return json({ ok: true });
}
