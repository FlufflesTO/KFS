-- Migration 0036: Add 'manager' role to users table
-- SQLite does not support ALTER TABLE to modify CHECK constraints,
-- so we recreate the table with the expanded role list.

PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND instr(email, '@') > 1),
  password_hash TEXT NOT NULL CHECK (length(password_hash) >= 40),
  role TEXT NOT NULL CHECK (role IN ('tech', 'admin', 'client', 'finance', 'manager')),
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  force_password_change INTEGER NOT NULL DEFAULT 0 CHECK (force_password_change IN (0, 1)),
  password_changed_at TEXT,
  last_login_at TEXT,
  mfa_required INTEGER NOT NULL DEFAULT 0 CHECK (mfa_required IN (0, 1)),
  mfa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (mfa_enabled IN (0, 1)),
  mfa_secret_encrypted TEXT,
  mfa_enabled_at TEXT,
  deleted_at TEXT
);

INSERT INTO users_new SELECT
  id, name, email, password_hash, role, site_id, is_active,
  created_at, updated_at, force_password_change, password_changed_at, last_login_at,
  mfa_required, mfa_enabled, mfa_secret_encrypted, mfa_enabled_at, deleted_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users(site_id);
CREATE INDEX IF NOT EXISTS idx_users_mfa_required ON users(role, mfa_required, mfa_enabled);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE TRIGGER IF NOT EXISTS trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

PRAGMA foreign_keys = ON;
