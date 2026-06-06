/**
 * Auth API Test Setup Script
 * Purpose: Create test user in local D1 database for auth testing
 * Usage: npx tsx scripts/setup-auth-test.ts
 */

import { hashPassword } from '../src/lib/server/auth.js';
import { randomUUID } from 'crypto';

// Test user configuration
const TEST_USER = {
  id: randomUUID(),
  name: 'Test Admin',
  email: 'test.admin@kharon.co.za',
  password: 'TestPassword123!',
  role: 'admin',
  is_active: 1,
  mfa_required: 0,
  mfa_enabled: 0,
  force_password_change: 0
};

async function hashPasswordNode(password: string): Promise<string> {
  // Node.js implementation for script usage
  const { pbkdf2 } = await import('crypto');
  const salt = randomUUID().replace(/-/g, '');
  
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, 600000, 32, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      
      // Base64URL encode salt and hash
      const encodeBase64Url = (buf: Buffer) => {
        return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      };
      
      const encodedSalt = encodeBase64Url(Buffer.from(salt));
      const encodedHash = encodeBase64Url(derivedKey);
      
      resolve(`pbkdf2_sha256$600000$${encodedSalt}$${encodedHash}`);
    });
  });
}

async function setupTestUser() {
  console.log('🔧 Setting up auth test user...\n');
  
  console.log('Test User Details:');
  console.log(`  ID:    ${TEST_USER.id}`);
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Role:  ${TEST_USER.role}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log();
  
  // Hash the password
  console.log('Hashing password...');
  const passwordHash = await hashPasswordNode(TEST_USER.password);
  console.log('✓ Password hashed\n');
  
  // Create SQL insert statement
  const insertSql = `
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active,
  mfa_required, mfa_enabled, force_password_change,
  created_at, updated_at
) VALUES (
  '${TEST_USER.id}',
  '${TEST_USER.name}',
  '${TEST_USER.email}',
  '${passwordHash}',
  '${TEST_USER.role}',
  ${TEST_USER.is_active},
  ${TEST_USER.mfa_required},
  ${TEST_USER.mfa_enabled},
  ${TEST_USER.force_password_change},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
  `.trim();
  
  console.log('SQL to execute:');
  console.log('─'.repeat(60));
  console.log(insertSql);
  console.log('─'.repeat(60));
  console.log();
  
  console.log('To apply this to your local database, run:');
  console.log(`  npx wrangler d1 execute kharon-portal --local --command "${insertSql.replace(/\n/g, ' ')}"`);
  console.log();
  
  // Also create a tech user for role testing
  const TECH_USER = {
    id: randomUUID(),
    name: 'Test Technician',
    email: 'test.tech@kharon.co.za',
    password: 'TestPassword123!',
    role: 'tech',
    is_active: 1,
    mfa_required: 0,
    mfa_enabled: 0,
    force_password_change: 0
  };
  
  const techPasswordHash = await hashPasswordNode(TECH_USER.password);
  
  const techInsertSql = `
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active,
  mfa_required, mfa_enabled, force_password_change,
  created_at, updated_at
) VALUES (
  '${TECH_USER.id}',
  '${TECH_USER.name}',
  '${TECH_USER.email}',
  '${techPasswordHash}',
  '${TECH_USER.role}',
  ${TECH_USER.is_active},
  ${TECH_USER.mfa_required},
  ${TECH_USER.mfa_enabled},
  ${TECH_USER.force_password_change},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
  `.trim();
  
  console.log('Additional tech user SQL:');
  console.log('─'.repeat(60));
  console.log(techInsertSql);
  console.log('─'.repeat(60));
  console.log();
  
  console.log('💡 Tip: Run both INSERT statements together to set up complete test data');
}

// Run setup
setupTestUser().catch(console.error);
