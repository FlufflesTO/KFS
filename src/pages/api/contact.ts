import type { APIRoute } from "astro";
import { auditError } from "../../lib/server/audit";
import { getDatabase } from "../../lib/server/bindings";
import { consumeRateLimit } from "../../lib/server/rateLimit";
import { sha256Text } from "../../lib/server/request";
import { ContactSubmissionSchema, ALLOWED_REQUEST_TYPES } from "../../lib/validation/schemas";
import { json, badRequest, tooManyRequests, serverError } from "../../lib/server/http";

export const prerender = false;

// Function to sanitize text against CSV injection
function sanitizeForCsvInjection(text: string): string {
  if (typeof text !== 'string') return text;
  return text.replace(/^([=+\-@])/g, "'$1");
}



export const POST: APIRoute = async ({ request }) => {
  let rawBody: Record<string, any> = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      rawBody = await request.json();
    } catch {
      return badRequest("Invalid JSON request.");
    }
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      rawBody = Object.fromEntries(form.entries());
    } catch {
      return badRequest("Invalid form request.");
    }
  } else {
    return badRequest("Unsupported content type.");
  }

  // Honeypot check
  if (rawBody.website) {
    return json({ ok: true });
  }

  // Map alternative field names before validation
  const dataToValidate = {
    name: rawBody.name,
    email: rawBody.email,
    requestType: rawBody.requestType || rawBody.subject,
    message: rawBody.message,
    popiaConsent: rawBody.popiaConsent || rawBody.popia_consent || rawBody.consent,
    website: rawBody.website
  };

  const parsed = ContactSubmissionSchema.safeParse(dataToValidate);
  if (!parsed.success) {
    return json({ ok: false, message: parsed.error.issues[0]?.message || "Validation failed." }, { status: 422 });
  }

  let { name, email, requestType, message } = parsed.data;

  // Strict check against allowed types (since Zod fallback allows any string)
  if (!ALLOWED_REQUEST_TYPES.includes(requestType)) {
      return json({ ok: false, message: "Invalid request type." }, { status: 422 });
  }

  // Apply CSV injection sanitization
  name = sanitizeForCsvInjection(name);
  requestType = sanitizeForCsvInjection(requestType) as typeof requestType;
  message = sanitizeForCsvInjection(message);

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const ipHash = await sha256Text(ip);

  let db;
  try {
    db = getDatabase();
  } catch {
    return serverError("Service temporarily unavailable.");
  }

  const limit = await consumeRateLimit(db, request, {
    scope: "public.contact",
    subject: ipHash,
    maxAttempts: 5,
    windowSeconds: 15 * 60
  });
  if (!limit.allowed) {
    return tooManyRequests("Too many submissions. Try again shortly.", limit.retryAfter);
  }

  const id = `cq-${crypto.randomUUID()}`;

  try {
    await db
      .prepare(
        `INSERT INTO contact_submissions (id, name, email, request_type, message, ip_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
      )
      .bind(id, name, email, requestType, message, ipHash)
      .run();
  } catch (error) {
    await auditError(db, request, error as Error, { metadata: { message: "contact submission failed" } });
    return serverError("Submission could not be saved. Email admin@kharon.co.za directly.");
  }

  return json({ ok: true });
};
