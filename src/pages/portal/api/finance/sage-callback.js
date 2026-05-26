/**
 * Project Sentinel - Sage Auth Callback Endpoint
 * Purpose: Handles OAuth callback from Sage, exchanges code for tokens, and persists them
 * Dependencies: cloudflare:workers, Astro, sqlite (D1)
 * Structural Role: API Endpoint Handler
 */

import { getBindings } from "../../../../lib/server/bindings.js";
import { auditEvent } from "../../../../lib/server/audit.js";
import { badRequest, forbidden, unauthorized } from "../../../../lib/server/http.js";

export const prerender = false;

export async function GET({ request, locals, url }) {
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

  if (error) {
    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "failure",
      user,
      metadata: { reason: "user_denied_or_error", error }
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/portal/finance/dashboard?error=" + encodeURIComponent("Sage authorization failed: " + error)
      }
    });
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

    const tokenData = await tokenResponse.json();
    const expiresAt = Math.floor(Date.now() / 1000) + Number(tokenData.expires_in || 3600);

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
    .bind(tokenData.access_token, tokenData.refresh_token, expiresAt)
    .run();

    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "success",
      user,
      metadata: { expiresAt: new Date(expiresAt * 1000).toISOString() }
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/portal/finance/dashboard?success=sage_connected"
      }
    });

  } catch (err) {
    await auditEvent(db, request, {
      eventType: "finance.sage_connect",
      entityType: "integration",
      entityId: "sage",
      outcome: "failure",
      user,
      metadata: { reason: "token_exchange_exception", error: err.message }
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/portal/finance/dashboard?error=" + encodeURIComponent("Token exchange exception: " + err.message)
      }
    });
  }
}
