export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

export function methodNotAllowed(allowed) {
  return json(
    { ok: false, error: "method_not_allowed", allowed },
    {
      status: 405,
      headers: { allow: allowed.join(", ") }
    }
  );
}

export function badRequest(message, details = {}) {
  return json({ ok: false, error: "bad_request", message, details }, { status: 400 });
}

export function unauthorized(message = "Authentication required.") {
  return json({ ok: false, error: "unauthorized", message }, { status: 401 });
}

export function forbidden(message = "You do not have permission to perform this action.") {
  return json({ ok: false, error: "forbidden", message }, { status: 403 });
}

export function tooManyRequests(message = "Too many requests. Try again later.", retryAfter = 60) {
  return json(
    { ok: false, error: "rate_limited", message, retryAfter },
    {
      status: 429,
      headers: { "retry-after": String(retryAfter) }
    }
  );
}

export function serverError(message = "The request could not be completed.") {
  return json({ ok: false, error: "server_error", message }, { status: 500 });
}
