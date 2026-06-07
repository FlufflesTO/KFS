import type { APIRoute } from "astro";
// @ts-ignore - cloudflare:workers is a Cloudflare runtime virtual module provided by the adapter
import { env as workerEnv } from "cloudflare:workers";
import { auditError } from "../../lib/server/audit";
import { getDatabase } from "../../lib/server/bindings";
import { consumeRateLimit } from "../../lib/server/rateLimit";
import { sha256Text } from "../../lib/server/request";
import { ContactSubmissionSchema, ALLOWED_REQUEST_TYPES } from "../../lib/validation/schemas";
import { json, badRequest, tooManyRequests, serverError } from "../../lib/server/http";

export const prerender = false;

const publicSiteUrl = import.meta.env.PUBLIC_SITE_URL || "https://www.tequit.co.za";
const portalUrl = import.meta.env.PUBLIC_PORTAL_URL || "https://portal.tequit.co.za";
const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "";
const allowedOrigins = new Set([
  new URL(publicSiteUrl).origin,
  "https://tequit.co.za",
  new URL(portalUrl).origin
]);

function sanitizeForCsvInjection(text: string): string {
  if (typeof text !== "string") return text;
  return text.replace(/^([=+\-@])/g, "'$1");
}

function corsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin") || "";
  if (allowedOrigins.has(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
    headers.set("vary", "Origin");
  }
  return headers;
}

function withCors(response: Response, request: Request): Response {
  const headers = corsHeaders(request);
  for (const [name, value] of headers) {
    response.headers.set(name, value);
  }
  return response;
}

function getRuntimeEnv(): Record<string, unknown> {
  const runtime = workerEnv as Record<string, unknown> | undefined;
  return {
    ...(typeof process !== "undefined" && process.env ? process.env : {}),
    ...(runtime || {})
  };
}

async function verifyTurnstile(request: Request, token: string): Promise<boolean> {
  const env = getRuntimeEnv();
  const secret = String(env.TURNSTILE_SECRET_KEY || "");
  if (!secret) return true;
  if (!token) return false;

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form
  });
  if (!response.ok) return false;
  const body = await response.json() as { success?: boolean };
  return body.success === true;
}

export const OPTIONS: APIRoute = async ({ request }) => new Response(null, {
  status: 204,
  headers: corsHeaders(request)
});

export const POST: APIRoute = async ({ request }) => {
  const finish = (response: Response) => withCors(response, request);
  let rawBody: Record<string, any> = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      rawBody = await request.json();
    } catch {
      return finish(badRequest("Invalid JSON request."));
    }
  } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    try {
      const form = await request.formData();
      rawBody = Object.fromEntries(form.entries());
    } catch {
      return finish(badRequest("Invalid form request."));
    }
  } else {
    return finish(badRequest("Unsupported content type."));
  }

  if (rawBody.website) {
    return finish(json({ ok: true }));
  }

  const startedAt = Number(rawBody.formStartedAt || rawBody.form_started_at || 0);
  const now = Date.now();
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now || now - startedAt > 2 * 60 * 60 * 1000) {
    return finish(json({ ok: false, message: "Bot protection is missing or expired." }, { status: 422 }));
  }
  if (now - startedAt < 2500) {
    return finish(json({ ok: true }));
  }

  const runtimeEnv = getRuntimeEnv();
  const environment = String(runtimeEnv.ENVIRONMENT || "local");
  const turnstileSecret = String(runtimeEnv.TURNSTILE_SECRET_KEY || "");
  if (turnstileSiteKey && environment !== "local" && !turnstileSecret) {
    return finish(serverError("Bot protection is not configured."));
  }

  const turnstileToken = String(rawBody["cf-turnstile-response"] || rawBody.turnstileToken || "");
  if (!(await verifyTurnstile(request, turnstileToken))) {
    return finish(json({ ok: false, message: "Bot protection failed." }, { status: 422 }));
  }

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
    return finish(json({ ok: false, message: parsed.error.issues[0]?.message || "Validation failed." }, { status: 422 }));
  }

  let { name, email, requestType, message } = parsed.data;

  if (!ALLOWED_REQUEST_TYPES.includes(requestType)) {
    return finish(json({ ok: false, message: "Invalid request type." }, { status: 422 }));
  }

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
    return finish(serverError("Service temporarily unavailable."));
  }

  const limit = await consumeRateLimit(db, request, {
    scope: "public.contact",
    subject: ipHash,
    maxAttempts: 5,
    windowSeconds: 15 * 60
  });
  if (!limit.allowed) {
    return finish(tooManyRequests("Too many submissions. Try again shortly.", limit.retryAfter));
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
    return finish(serverError("Submission could not be saved. Email admin@kharon.co.za directly."));
  }

  return finish(json({ ok: true }));
};
