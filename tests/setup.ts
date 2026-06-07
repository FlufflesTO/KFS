/**
 * Global Test Setup
 * Purpose: Seeds fixture test users into the local D1 database before integration tests run.
 * Runs once before the full test suite via Playwright globalSetup.
 *
 * Prerequisite: D1 migrations must already be applied:
 *   npx wrangler d1 migrations apply kharon-portal --local --config wrangler.portal.jsonc
 *
 * Users seeded here use emails like admin.test@tequit.co.za and password TestPassword123!
 * They are separate from the dev seed (seed-users.sql) so test state never pollutes dev state.
 */

import { execFileSync } from 'child_process';
import { seedTestUsersSQL, cleanupTestUsersSQL } from './fixtures/test-users';

import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function runD1Command(sql: string): void {
  const tempFile = join(tmpdir(), `test-seed-${crypto.randomUUID()}.sql`);
  writeFileSync(tempFile, sql, 'utf8');
  
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  try {
    execFileSync(
      npxCmd,
      [
        'wrangler', 'd1', 'execute', 'kharon-portal',
        '--local',
        '--config', 'wrangler.portal.jsonc',
        '--file', tempFile,
      ],
      { stdio: 'pipe', shell: true }
    );
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore
    }
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function encryptSecret(secret: string, mfaSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(mfaSecret);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);
  const key = await crypto.subtle.importKey("raw", new Uint8Array(digest), { name: "AES-GCM" }, false, ["encrypt"]);
  
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(secret));
  return `${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(encrypted))}`;
}

export default async function globalSetup(): Promise<void> {
  try {
    const mfaSecret = process.env.MFA_SECRET || 'local_mfa_secret_value_32_chars_long';
    const encryptedSecret = await encryptSecret('JBSWY3DPEHPK3PXP', mfaSecret);
    
    const seededSQL = seedTestUsersSQL.replace('MFA_SECRET_PLACEHOLDER', encryptedSecret);
    
    runD1Command(seededSQL);
    console.log('[setup] Test fixture users seeded successfully.');
  } catch (err) {
    // Log but do not throw — tests that require seeded users will fail with clear 401s,
    // which is more informative than aborting the whole suite from setup.
    console.warn('[setup] WARNING: Could not seed test fixture users.');
    console.warn('[setup] Run migrations first: npx wrangler d1 migrations apply kharon-portal --local --config wrangler.portal.jsonc');
    console.warn('[setup] Error:', (err as Error).message?.split('\n')[0]);
  }
}

export async function globalTeardown(): Promise<void> {
  try {
    runD1Command(cleanupTestUsersSQL);
    console.log('[teardown] Test fixture users removed.');
  } catch {
    // Non-fatal — fixture rows are replaced on next run via INSERT OR REPLACE
  }
}
