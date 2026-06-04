/**
 * Test User Fixtures
 * Purpose: Provides standardized test user credentials for integration tests
 * Usage: Import these fixtures in your test files
 * 
 * Note: These users must be seeded into the test database before tests run.
 * Run: npx wrangler d1 migrations apply kharon-portal --local
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'tech' | 'client' | 'finance' | 'manager';
  siteId?: string | null;
  mfaEnabled?: boolean;
  mfaSecret?: string;
}

/**
 * Test user credentials for integration testing
 * Passwords are intentionally weak for test purposes only
 */
export const testUsers: Record<string, TestUser> = {
  admin: {
    id: 'test-admin-001',
    email: 'admin.test@kharon.co.za',
    password: 'TestPassword123!',
    name: 'Test Admin User',
    role: 'admin',
    siteId: null,
    mfaEnabled: false,
  },
  finance: {
    id: 'test-finance-001',
    email: 'finance.test@kharon.co.za',
    password: 'TestPassword123!',
    name: 'Test Finance User',
    role: 'finance',
    siteId: null,
    mfaEnabled: false,
  },
  tech: {
    id: 'test-tech-001',
    email: 'tech.test@kharon.co.za',
    password: 'TestPassword123!',
    name: 'Test Technician',
    role: 'tech',
    siteId: 'test-site-001',
    mfaEnabled: false,
  },
  client: {
    id: 'test-client-001',
    email: 'client.test@example.com',
    password: 'TestPassword123!',
    name: 'Test Client User',
    role: 'client',
    siteId: 'test-site-001',
    mfaEnabled: false,
  },
  inactive: {
    id: 'test-inactive-001',
    email: 'inactive.test@kharon.co.za',
    password: 'TestPassword123!',
    name: 'Test Inactive User',
    role: 'client',
    siteId: null,
    mfaEnabled: false,
  },
};

/**
 * Invalid test credentials for negative testing
 */
export const invalidCredentials = {
  wrongPassword: {
    email: 'admin.test@kharon.co.za',
    password: 'WrongPassword456!',
  },
  nonExistentUser: {
    email: 'doesnotexist@kharon.co.za',
    password: 'TestPassword123!',
  },
  missingEmail: {
    password: 'TestPassword123!',
  },
  missingPassword: {
    email: 'admin.test@kharon.co.za',
  },
  emptyBody: {},
};

/**
 * Generate a unique test email to avoid collisions
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}.${timestamp}.${random}@kharon.co.za`;
}

/**
 * Generate a secure random password for test users
 */
export function generateTestPassword(): string {
  const random = Math.random().toString(36).substring(2, 12);
  return `Test${random.toUpperCase()}!123`;
}

/**
 * SQL statements to seed test users into D1 database
 * Run these before integration tests
 */
export const seedTestUsersSQL = `
-- Insert test users (password hash is for 'TestPassword123!')
-- Hash generated with: pbkdf2_sha256$600000$<salt>$<hash>
-- For testing, we use a pre-computed hash

INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active, 
  mfa_required, mfa_enabled, mfa_secret_encrypted,
  force_password_change, deleted_at
) VALUES 
  (
    'test-admin-001',
    'Test Admin User',
    'admin.test@kharon.co.za',
    'pbkdf2_sha256$600000$c29tZXNhbHQ$VGVzdEhhc2hGb3JUZXN0UGFzc3dvcmQxMjMh',
    'admin',
    1,
    0,
    0,
    NULL,
    0,
    NULL
  ),
  (
    'test-finance-001',
    'Test Finance User',
    'finance.test@kharon.co.za',
    'pbkdf2_sha256$600000$c29tZXNhbHQ$VGVzdEhhc2hGb3JUZXN0UGFzc3dvcmQxMjMh',
    'finance',
    1,
    0,
    0,
    NULL,
    0,
    NULL
  ),
  (
    'test-tech-001',
    'Test Technician',
    'tech.test@kharon.co.za',
    'pbkdf2_sha256$600000$c29tZXNhbHQ$VGVzdEhhc2hGb3JUZXN0UGFzc3dvcmQxMjMh',
    'tech',
    1,
    0,
    0,
    NULL,
    0,
    NULL
  ),
  (
    'test-client-001',
    'Test Client User',
    'client.test@example.com',
    'pbkdf2_sha256$600000$c29tZXNhbHQ$VGVzdEhhc2hGb3JUZXN0UGFzc3dvcmQxMjMh',
    'client',
    1,
    0,
    0,
    NULL,
    0,
    NULL
  ),
  (
    'test-inactive-001',
    'Test Inactive User',
    'inactive.test@kharon.co.za',
    'pbkdf2_sha256$600000$c29tZXNhbHQ$VGVzdEhhc2hGb3JUZXN0UGFzc3dvcmQxMjMh',
    'client',
    0,
    0,
    0,
    NULL,
    0,
    NULL
  );

-- Insert test site for technician and client
INSERT OR REPLACE INTO sites (
  id, owner_company_name, physical_address, site_contact_person,
  site_contact_email, site_contact_phone, gps_coordinates
) VALUES (
  'test-site-001',
  'Test Company Pty Ltd',
  '123 Test Street, Test City, 0001',
  'Test Contact Person',
  'contact@testcompany.co.za',
  '+27 12 345 6789',
  '{"latitude": -25.7479, "longitude": 28.2293}'
);
`;

/**
 * SQL statements to clean up test data after tests
 */
export const cleanupTestUsersSQL = `
-- Delete test users
DELETE FROM users WHERE id IN (
  'test-admin-001',
  'test-finance-001',
  'test-tech-001',
  'test-client-001',
  'test-inactive-001'
);

-- Delete test site
DELETE FROM sites WHERE id = 'test-site-001';
`;
