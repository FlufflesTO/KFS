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
  'site_tequit_staging',
  'Tequit Staging Client',
  'Staging address to be replaced',
  'Client Contact',
  'client@example.com',
  '',
  'billing@example.com'
)
ON CONFLICT(id) DO UPDATE SET
  owner_company_name = excluded.owner_company_name,
  physical_address = excluded.physical_address,
  site_contact_person = excluded.site_contact_person,
  site_contact_email = excluded.site_contact_email,
  billing_emails = excluded.billing_emails;

INSERT INTO users (id, name, email, password_hash, role, site_id, is_active)
VALUES
  ('usr_admin_001', 'Kharon Admin', 'admin@kharon.co.za', 'pbkdf2_sha256$100000$OGUxNDI5N2MtMzA2Mi00MDE2LWJjNWYtYjk2MTlkY2MyNjc3$WCZGErOVsgQWdBeKpnjApKT6L3srzO80-NtnKlz37ys', 'admin', NULL, 1),
  ('usr_tech_001', 'Kharon Technician', 'tech@kharon.co.za', 'pbkdf2_sha256$100000$OGUxNDI5N2MtMzA2Mi00MDE2LWJjNWYtYjk2MTlkY2MyNjc3$WCZGErOVsgQWdBeKpnjApKT6L3srzO80-NtnKlz37ys', 'tech', NULL, 1),
  ('usr_finance_001', 'Kharon Finance', 'finance@kharon.co.za', 'pbkdf2_sha256$100000$OGUxNDI5N2MtMzA2Mi00MDE2LWJjNWYtYjk2MTlkY2MyNjc3$WCZGErOVsgQWdBeKpnjApKT6L3srzO80-NtnKlz37ys', 'finance', NULL, 1),
  ('usr_client_001', 'Client Portal User', 'client@example.com', 'pbkdf2_sha256$100000$OGUxNDI5N2MtMzA2Mi00MDE2LWJjNWYtYjk2MTlkY2MyNjc3$WCZGErOVsgQWdBeKpnjApKT6L3srzO80-NtnKlz37ys', 'client', 'site_tequit_staging', 1)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  site_id = excluded.site_id,
  is_active = excluded.is_active,
  mfa_required = 0,
  mfa_enabled = 0,
  mfa_secret_encrypted = NULL,
  updated_at = CURRENT_TIMESTAMP;
