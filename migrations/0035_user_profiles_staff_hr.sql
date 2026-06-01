-- Migration 0035: User profile customization and staff HR vault
-- Scope: self-service profile details, staff leave requests, and internal document vault metadata.

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_name TEXT,
  phone TEXT,
  job_title TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notification_email TEXT,
  portal_density TEXT NOT NULL DEFAULT 'comfortable' CHECK (portal_density IN ('compact', 'comfortable')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS trg_user_profiles_updated_at
AFTER UPDATE ON user_profiles
FOR EACH ROW
BEGIN
  UPDATE user_profiles SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = OLD.user_id;
END;

CREATE TABLE IF NOT EXISTS staff_leave_balances (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  annual_days_remaining INTEGER NOT NULL DEFAULT 15 CHECK (annual_days_remaining >= 0),
  sick_days_remaining INTEGER NOT NULL DEFAULT 30 CHECK (sick_days_remaining >= 0),
  family_responsibility_days_remaining INTEGER NOT NULL DEFAULT 3 CHECK (family_responsibility_days_remaining >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS trg_staff_leave_balances_updated_at
AFTER UPDATE ON staff_leave_balances
FOR EACH ROW
BEGIN
  UPDATE staff_leave_balances SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE user_id = OLD.user_id;
END;

CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'family_responsibility', 'unpaid')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_requested INTEGER NOT NULL CHECK (days_requested BETWEEN 1 AND 60),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  supporting_document_id TEXT,
  reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  FOREIGN KEY (supporting_document_id) REFERENCES staff_documents(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_user ON staff_leave_requests(user_id, status, start_date);
CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_status ON staff_leave_requests(status, start_date);
CREATE INDEX IF NOT EXISTS idx_staff_leave_requests_deleted_at ON staff_leave_requests(deleted_at);

CREATE TRIGGER IF NOT EXISTS trg_staff_leave_requests_updated_at
AFTER UPDATE ON staff_leave_requests
FOR EACH ROW
BEGIN
  UPDATE staff_leave_requests SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS staff_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('medical_certificate', 'payslip', 'contract', 'training_certificate', 'id_document', 'other')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 10485760),
  uploaded_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_documents_user ON staff_documents(user_id, category, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_staff_documents_storage_path ON staff_documents(storage_path);
CREATE INDEX IF NOT EXISTS idx_staff_documents_deleted_at ON staff_documents(deleted_at);
