/**
 * Project Sentinel - Sage Integration Service
 * Purpose: Sage OAuth token and helper utility service
 * Dependencies: cloudflare:workers, sqlite (D1)
 * Structural Role: Server-side integration service
 */

/**
 * Gets the current connection status of Sage from the database.
 * @param {import("cloudflare:workers").D1Database} db
 * @returns {Promise<{connected: boolean, expired?: boolean, expiresAt?: string}>}
 */
export async function getSageConnectionStatus(db) {
  const row = await db.prepare("SELECT expires_at FROM sage_config WHERE id = 1").first();
  if (!row) {
    return { connected: false };
  }
  const isExpired = Date.now() / 1000 >= row.expires_at;
  return {
    connected: true,
    expired: isExpired,
    expiresAt: new Date(row.expires_at * 1000).toISOString()
  };
}

/**
 * Disconnects Sage by deleting the local config credentials.
 * @param {import("cloudflare:workers").D1Database} db
 * @returns {Promise<void>}
 */
export async function disconnectSage(db) {
  await db.prepare("DELETE FROM sage_config WHERE id = 1").run();
}

/**
 * Retrieves a valid Sage Access Token. Automatically refreshes it if expired.
 * @param {import("cloudflare:workers").D1Database} db
 * @param {Record<string, unknown>} env
 * @returns {Promise<string>}
 */
export async function getValidSageToken(db, env) {
  const row = await db.prepare("SELECT access_token, refresh_token, expires_at FROM sage_config WHERE id = 1").first();
  if (!row) {
    throw new Error("Sage is not connected. OAuth access token is missing.");
  }

  // If token expires in less than 5 minutes, refresh it
  if (Date.now() / 1000 >= row.expires_at - 300) {
    return await refreshSageToken(db, env, row.refresh_token);
  }

  return row.access_token;
}

/**
 * Refreshes the Sage access token using the refresh token.
 * @param {import("cloudflare:workers").D1Database} db
 * @param {Record<string, unknown>} env
 * @param {string} refreshToken
 * @returns {Promise<string>}
 */
async function refreshSageToken(db, env, refreshToken) {
  const clientId = String(env.SAGE_CLIENT_ID || "");
  const clientSecret = String(env.SAGE_CLIENT_SECRET || "");

  if (!clientId || !clientSecret) {
    throw new Error("Sage environment variables SAGE_CLIENT_ID or SAGE_CLIENT_SECRET are not configured.");
  }

  const response = await fetch("https://oauth.accounting.sageone.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to refresh Sage OAuth token: ${response.statusText}. Details: ${errText}`);
  }

  const data = await response.json();
  const expiresAt = Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);

  await db.prepare(
    `INSERT INTO sage_config (id, access_token, refresh_token, expires_at, updated_at)
     VALUES (1, ?1, ?2, ?3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       updated_at = excluded.updated_at`
  )
  .bind(data.access_token, data.refresh_token, expiresAt)
  .run();

  return data.access_token;
}
