-- Migration: Staff HR and File Vault
-- Creates staff_members and staff_files tables for the admin HR section.

CREATE TABLE IF NOT EXISTS staff_members (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  start_date TEXT,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  status TEXT NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS staff_files (
  id TEXT PRIMARY KEY,
  staff_member_id TEXT NOT NULL REFERENCES staff_members(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_staff_files_member ON staff_files(staff_member_id);
