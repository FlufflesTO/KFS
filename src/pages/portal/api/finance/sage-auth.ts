/**
 * Project Sentinel - Sage Auth Endpoint
 * Purpose: Initiates the Sage Accounting OAuth 2.0 flow
 * Dependencies: cloudflare:workers, Astro
 * Structural Role: API Endpoint Handler
 */

import { getBindings } from "../../../../lib/server/bindings.ts";
import { forbidden, unauthorized } from "../../../../lib/server/http.ts";
import type { APIContext } from "astro";

export const prerender = false;

function stateCookie(value: string) {
  return `kharon_sage_oauth_state=${encodeURIComponent(value)}; Path=/portal/api/finance; HttpOnly; Secure; SameSite=Strict; Max-Age=600`;
}

export async function GET({ request, locals, url }: APIContext) {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!["finance", "admin"].includes(user.role)) {
    return forbidden("Only finance or admin accounts can initiate Sage integration.");
  }

  let env;
  try {
    const bindings = getBindings();
    env = bindings.env;
  } catch (error) {
    return new Response("Server configuration error: Worker bindings not found.", { status: 500 });
  }

  const clientId = String(env.SAGE_CLIENT_ID || "");
  if (!clientId) {
    return new Response("Sage Integration Error: SAGE_CLIENT_ID is not configured in the server environment.", { status: 500 });
  }

  // Determine redirect URI: use env variable or derive from request host
  const redirectUri = String(env.SAGE_REDIRECT_URI || `${url.origin}/portal/api/finance/sage-callback`);
  const state = crypto.randomUUID();

  // Redirect to Sage Centralized Authorization
  const sageAuthUrl = new URL("https://www.sageone.com/oauth2/auth/central");
  sageAuthUrl.searchParams.set("client_id", clientId);
  sageAuthUrl.searchParams.set("response_type", "code");
  sageAuthUrl.searchParams.set("redirect_uri", redirectUri);
  sageAuthUrl.searchParams.set("scope", "full_access");
  sageAuthUrl.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: sageAuthUrl.toString(),
      "Set-Cookie": stateCookie(state)
    },
  });
}
