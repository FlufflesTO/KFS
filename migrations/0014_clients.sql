PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL CHECK (length(trim(company_name)) BETWEEN 2 AND 200),
  contact_person TEXT CHECK (contact_person IS NULL OR length(trim(contact_person)) BETWEEN 2 AND 160),
  contact_email TEXT CHECK (contact_email IS NULL OR instr(contact_email, '@') > 1),
  contact_phone TEXT,
  billing_address TEXT CHECK (billing_address IS NULL OR length(trim(billing_address)) BETWEEN 5 AND 500),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(contact_email);

CREATE TRIGGER IF NOT EXISTS trg_clients_updated_at
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
