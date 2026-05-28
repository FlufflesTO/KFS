/**
 * Project Sentinel - HTTP Utility Helpers
 * Purpose: Provides structured and typed HTTP Response generators
 * Dependencies: None
 * Structural Role: HTTP response layer helper utilities
 */

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function methodNotAllowed(allowed: string[]): Response {
  return json(
    { ok: false, error: "method_not_allowed", allowed },
    {
      status: 405,
      headers: { allow: allowed.join(", ") }
    }
  );
}

export function badRequest(message: string, details: Record<string, unknown> = {}): Response {
  return json({ ok: false, error: "bad_request", message, details }, { status: 400 });
}

export function unauthorized(message: string = "Authentication required."): Response {
  return json({ ok: false, error: "unauthorized", message }, { status: 401 });
}

export function forbidden(message: string = "You do not have permission to perform this action."): Response {
  return json({ ok: false, error: "forbidden", message }, { status: 403 });
}

export function tooManyRequests(message: string = "Too many requests. Try again later.", retryAfter: number = 60): Response {
  return json(
    { ok: false, error: "rate_limited", message, retryAfter },
    {
      status: 429,
      headers: { "retry-after": String(retryAfter) }
    }
  );
}

export function serverError(message: string = "The request could not be completed."): Response {
  return json({ ok: false, error: "server_error", message }, { status: 500 });
}
