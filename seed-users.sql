-- KFS Dev Seed Users
-- All users share the dev password: KharonDev2026!
-- MFA and force_password_change disabled for local development.

-- Client site (required FK for client role)
INSERT INTO sites (
  id,
  owner_company_name,
  physical_address,
  site_contact_person,
  site_contact_email,
  site_contact_phone,
  billing_emails
)
VALUES (
  'site_gwc_dev',
  'GWC (Dev Client)',
  '123 Dev Street, Cape Town',
  'Alistair',
  'alistair@gwc.com',
  '',
  'alistair@gwc.com'
)
ON CONFLICT(id) DO UPDATE SET
  owner_company_name = excluded.owner_company_name,
  physical_address = excluded.physical_address,
  site_contact_person = excluded.site_contact_person,
  site_contact_email = excluded.site_contact_email,
  billing_emails = excluded.billing_emails;

-- Dev password hash for: KharonDev2026!
-- pbkdf2_sha256$100000$NWU2ODc1MmItZDhkNi00MGJiLTk3MDAtY2IyZWI1ZTdkZDg3$tnhFUWlLjU2n6IhXU8nitcJ1KYJsUCxkJzrC-0EA6pg
INSERT INTO users (id, name, email, password_hash, role, site_id, is_active)
VALUES
  ('usr_connor', 'Connor Venter', 'connor@kharon.co.za', 'pbkdf2_sha256$100000$NWU2ODc1MmItZDhkNi00MGJiLTk3MDAtY2IyZWI1ZTdkZDg3$tnhFUWlLjU2n6IhXU8nitcJ1KYJsUCxkJzrC-0EA6pg', 'admin', NULL, 1),
  ('usr_kim', 'Kim', 'kim@kharon.co.za', 'pbkdf2_sha256$100000$NWU2ODc1MmItZDhkNi00MGJiLTk3MDAtY2IyZWI1ZTdkZDg3$tnhFUWlLjU2n6IhXU8nitcJ1KYJsUCxkJzrC-0EA6pg', 'finance', NULL, 1),
  ('usr_anthony', 'Anthony', 'anthony@kharon.co.za', 'pbkdf2_sha256$100000$NWU2ODc1MmItZDhkNi00MGJiLTk3MDAtY2IyZWI1ZTdkZDg3$tnhFUWlLjU2n6IhXU8nitcJ1KYJsUCxkJzrC-0EA6pg', 'manager', NULL, 1),
  ('usr_alistair', 'Alistair', 'alistair@gwc.com', 'pbkdf2_sha256$100000$NWU2ODc1MmItZDhkNi00MGJiLTk3MDAtY2IyZWI1ZTdkZDg3$tnhFUWlLjU2n6IhXU8nitcJ1KYJsUCxkJzrC-0EA6pg', 'client', 'site_gwc_dev', 1),
  ('usr_georgiy', 'Georgiy', 'georgiy@kharon.co.za', 'pbkdf2_sha256$100000$NWU2ODc1MmItZDhkNi00MGJiLTk3MDAtY2IyZWI1ZTdkZDg3$tnhFUWlLjU2n6IhXU8nitcJ1KYJsUCxkJzrC-0EA6pg', 'tech', NULL, 1)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  site_id = excluded.site_id,
  is_active = excluded.is_active,
  force_password_change = 0,
  mfa_required = 0,
  mfa_enabled = 0,
  mfa_secret_encrypted = NULL,
  updated_at = CURRENT_TIMESTAMP;
