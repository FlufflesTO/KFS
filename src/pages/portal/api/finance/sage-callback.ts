/**
 * Project Sentinel - Sage Auth Callback Endpoint
 * Purpose: Handles OAuth callback from Sage, exchanges code for tokens, encrypts, and persists them
 * Dependencies: cloudflare:workers, Astro, sqlite (D1), crypto.js
 * Structural Role: API Endpoint Handler
 */

import { getBindings } from "../../../../lib/server/bindings.ts";
import { auditEvent } from "../../../../lib/server/audit";
import { badRequest, forbidden, unauthorized } from "../../../../lib/server/http.ts";
import { encryptText } from "../../../../lib/server/crypto.ts";
import type { APIContext } from "astro";

export const prerender = false;

function clearStateCookie(): string {
  return "kharon_sage_oauth_state=; Path=/portal/api/finance; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

function redirectToFinance(location: string) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      "Set-Cookie": clearStateCookie()
    }
  });
}

export async function GET({ request, locals, url, cookies }: APIContext) {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!["finance", "admin"].includes(user.role)) {
    return forbidden("Only finance or admin accounts can complete Sage integration.");
  }

  let db, env;
  try {
    const bindings = getBindings();
    db = bindings.db;
    env = bindings.env;
  } catch (error) {
    return new Response("Server configuration error: Worker bindings not found.", { status: 500 });
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");
  const expectedState = cookies.get("kharon_sage_oauth_state")?.value || "";

  if (error) {
    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "failure",
      user,
      metadata: { reason: "user_denied_or_error", error }
    });
    return redirectToFinance("/portal/finance/dashboard?error=" + encodeURIComponent("Sage authorization failed."));
  }

  if (!state || !expectedState || state !== expectedState) {
    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "blocked",
      user,
      metadata: { reason: "invalid_oauth_state" }
    });
    return badRequest("Invalid Sage authorization state.");
  }

  if (!code) {
    return badRequest("Missing authorization code.");
  }

  const clientId = String(env.SAGE_CLIENT_ID || "");
  const clientSecret = String(env.SAGE_CLIENT_SECRET || "");
  if (!clientId || !clientSecret) {
    return new Response("Sage Integration Error: SAGE_CLIENT_ID or SAGE_CLIENT_SECRET is not configured.", { status: 500 });
  }

  const redirectUri = String(env.SAGE_REDIRECT_URI || `${url.origin}/portal/api/finance/sage-callback`);

  try {
    // Exchange Auth Code for Access Token
    const tokenResponse = await fetch("https://oauth.accounting.sageone.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}. Details: ${errText}`);
    }

    const tokenData = await tokenResponse.json() as { access_token: string; refresh_token: string; expires_in?: number };
    const expiresAt = Math.floor(Date.now() / 1000) + Number(tokenData.expires_in || 3600);

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptText(tokenData.access_token, env);
    const encryptedRefreshToken = await encryptText(tokenData.refresh_token, env);

    // Save tokens in database (upsert on ID 1)
    await db.prepare(
      `INSERT INTO sage_config (id, access_token, refresh_token, expires_at, updated_at)
       VALUES (1, ?1, ?2, ?3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT(id) DO UPDATE SET
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at,
         updated_at = excluded.updated_at`
    )
    .bind(encryptedAccessToken, encryptedRefreshToken, expiresAt)
    .run();

    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "success",
      user,
      metadata: { expiresAt: new Date(expiresAt * 1000).toISOString() }
    });

    return redirectToFinance("/portal/finance/dashboard?success=sage_connected");

  } catch (err) {
    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "failure",
      user,
      metadata: { reason: "token_exchange_exception", error: err.name || "Error" }
    });

    return redirectToFinance("/portal/finance/dashboard?error=" + encodeURIComponent("Sage token exchange failed."));
  }
}
