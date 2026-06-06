/**
 * Project Sentinel - Sage Integration Service
 * Purpose: Sage OAuth token and helper utility service with AES-GCM encryption
 * Dependencies: cloudflare:workers, sqlite (D1), crypto.ts
 * Structural Role: Server-side integration service
 */

import type { D1Database } from "@cloudflare/workers-types";
import { encryptText, decryptText } from "./crypto";

export interface SageConnectionStatus {
  connected: boolean;
  expired?: boolean;
  expiresAt?: string;
}

export interface SageConfigRow {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Gets the current connection status of Sage from the database.
 * @param db The D1 database instance
 * @returns Connection status object
 */
export async function getSageConnectionStatus(db: D1Database): Promise<SageConnectionStatus> {
  const row = await db.prepare("SELECT expires_at FROM sage_config WHERE id = 1").first<SageConfigRow>();
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
 * @param db The D1 database instance
 */
export async function disconnectSage(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM sage_config WHERE id = 1").run();
}

/**
 * Retrieves a valid Sage Access Token. Automatically refreshes it if expired.
 * @param db The D1 database instance
 * @param env The environment variables object
 * @returns A valid plain-text access token
 */
export async function getValidSageToken(db: D1Database, env: Record<string, unknown>): Promise<string> {
  const row = await db.prepare("SELECT access_token, refresh_token, expires_at FROM sage_config WHERE id = 1").first<SageConfigRow>();
  if (!row) {
    throw new Error("Sage is not connected. OAuth access token is missing.");
  }

  // If token expires in less than 5 minutes, refresh it using decrypted refresh token
  if (Date.now() / 1000 >= row.expires_at - 300) {
    const plainRefreshToken = await decryptText(row.refresh_token, env);
    return await refreshSageToken(db, env, plainRefreshToken);
  }

  // Return decrypted access token
  return await decryptText(row.access_token, env);
}

/**
 * Refreshes the Sage access token using the refresh token and stores encrypted tokens.
 * @param db The D1 database instance
 * @param env The environment variables object
 * @param refreshToken The plain-text refresh token
 * @returns The new plain-text access token
 */
async function refreshSageToken(db: D1Database, env: Record<string, unknown>, refreshToken: string): Promise<string> {
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

  interface SageTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
  }

  const data = (await response.json()) as SageTokenResponse;
  const expiresAt = Math.floor(Date.now() / 1000) + Number(data.expires_in || 3600);

  // Encrypt tokens before storing
  const encryptedAccessToken = await encryptText(data.access_token, env);
  const encryptedRefreshToken = await encryptText(data.refresh_token, env);

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

  return data.access_token;
}
