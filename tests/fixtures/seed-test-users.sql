-- Test Users Seed File
-- Purpose: Seed test database with users for integration testing
-- Usage: npx wrangler d1 execute kharon-portal --local --file=tests/fixtures/seed-test-users.sql

-- Note: Password hash is for 'TestPassword123!'
-- In a real test scenario, you would generate these hashes programmatically

-- Insert test admin user
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active, 
  mfa_required, mfa_enabled, mfa_secret_encrypted,
  force_password_change, deleted_at
) VALUES (
  'test-admin-001',
  'Test Admin User',
  'admin.test@kharon.co.za',
  'pbkdf2_sha256$600000$NzMxZTVlMTdhM2ViYTUwZjhhOWU4YWNiZTQ5MDc2ZjY$ilF6KpEL6QvzvB-s4Zim0aLfMPrVfuYy-T-rl5DDBOM',
  'admin',
  1,
  0,
  0,
  NULL,
  0,
  NULL
);

-- Insert test finance user
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active, 
  mfa_required, mfa_enabled, mfa_secret_encrypted,
  force_password_change, deleted_at
) VALUES (
  'test-finance-001',
  'Test Finance User',
  'finance.test@kharon.co.za',
  'pbkdf2_sha256$600000$NzMxZTVlMTdhM2ViYTUwZjhhOWU4YWNiZTQ5MDc2ZjY$ilF6KpEL6QvzvB-s4Zim0aLfMPrVfuYy-T-rl5DDBOM',
  'finance',
  1,
  0,
  0,
  NULL,
  0,
  NULL
);

-- Insert test technician user
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active, 
  mfa_required, mfa_enabled, mfa_secret_encrypted,
  force_password_change, deleted_at
) VALUES (
  'test-tech-001',
  'Test Technician',
  'tech.test@kharon.co.za',
  'pbkdf2_sha256$600000$NzMxZTVlMTdhM2ViYTUwZjhhOWU4YWNiZTQ5MDc2ZjY$ilF6KpEL6QvzvB-s4Zim0aLfMPrVfuYy-T-rl5DDBOM',
  'tech',
  1,
  0,
  0,
  NULL,
  0,
  NULL
);

-- Insert test client user
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active, 
  mfa_required, mfa_enabled, mfa_secret_encrypted,
  force_password_change, deleted_at
) VALUES (
  'test-client-001',
  'Test Client User',
  'client.test@example.com',
  'pbkdf2_sha256$600000$NzMxZTVlMTdhM2ViYTUwZjhhOWU4YWNiZTQ5MDc2ZjY$ilF6KpEL6QvzvB-s4Zim0aLfMPrVfuYy-T-rl5DDBOM',
  'client',
  1,
  0,
  0,
  NULL,
  0,
  NULL
);

-- Insert test inactive user
INSERT OR REPLACE INTO users (
  id, name, email, password_hash, role, is_active, 
  mfa_required, mfa_enabled, mfa_secret_encrypted,
  force_password_change, deleted_at
) VALUES (
  'test-inactive-001',
  'Test Inactive User',
  'inactive.test@kharon.co.za',
  'pbkdf2_sha256$600000$NzMxZTVlMTdhM2ViYTUwZjhhOWU4YWNiZTQ5MDc2ZjY$ilF6KpEL6QvzvB-s4Zim0aLfMPrVfuYy-T-rl5DDBOM',
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
