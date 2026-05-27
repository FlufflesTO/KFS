import { auditError } from "../../lib/server/audit.js";
import { getDatabase } from "../../lib/server/bindings.ts";
import { consumeRateLimit } from "../../lib/server/rateLimit.js";
import { sha256Text } from "../../lib/server/request.js";
import { ContactSubmissionSchema, ALLOWED_REQUEST_TYPES } from "../../lib/validation/schemas.js";

export const prerender = false;

// Function to sanitize text against CSV injection
function sanitizeForCsvInjection(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/^([=+\-@])/g, "'$1");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function POST({ request }) {
  let rawBody = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      rawBody = await request.json();
    } catch {
      return json({ ok: false, message: "Invalid JSON request." }, 400);
    }
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      rawBody = Object.fromEntries(form.entries());
    } catch {
      return json({ ok: false, message: "Invalid form request." }, 400);
    }
  } else {
    return json({ ok: false, message: "Unsupported content type." }, 400);
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
    return json({ ok: false, message: parsed.error.errors[0]?.message || "Validation failed." }, 422);
  }

  let { name, email, requestType, message } = parsed.data;

  // Strict check against allowed types (since Zod fallback allows any string)
  if (!ALLOWED_REQUEST_TYPES.includes(requestType)) {
      return json({ ok: false, message: "Invalid request type." }, 422);
  }

  // Apply CSV injection sanitization
  name = sanitizeForCsvInjection(name);
  requestType = sanitizeForCsvInjection(requestType);
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
    await auditError(db, request, error, { metadata: { message: "contact submission failed" } });
    return json(
      { ok: false, message: "Submission could not be saved. Email admin@kharon.co.za directly." },
      500
    );
  }

  return json({ ok: true });
}
