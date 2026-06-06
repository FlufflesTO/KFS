/**
 * Global Test Setup
 * Purpose: Seeds fixture test users into the local D1 database before integration tests run.
 * Runs once before the full test suite via Playwright globalSetup.
 *
 * Prerequisite: D1 migrations must already be applied:
 *   npx wrangler d1 migrations apply kharon-portal --local --config wrangler.portal.jsonc
 *
 * Users seeded here use emails like admin.test@kharon.co.za and password TestPassword123!
 * They are separate from the dev seed (seed-users.sql) so test state never pollutes dev state.
 */

import { execFileSync } from 'child_process';
import { seedTestUsersSQL, cleanupTestUsersSQL } from './fixtures/test-users';

function runD1Command(sql: string): void {
  // Use execFileSync with an argument array — no shell interpolation, no injection risk
  // npx is the executable; all wrangler arguments are discrete array entries
  execFileSync(
    'npx',
    [
      'wrangler', 'd1', 'execute', 'kharon-portal',
      '--local',
      '--config', 'wrangler.portal.jsonc',
      '--command', sql,
    ],
    { stdio: 'pipe' }
  );
}

export default async function globalSetup(): Promise<void> {
  try {
    runD1Command(seedTestUsersSQL);
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
