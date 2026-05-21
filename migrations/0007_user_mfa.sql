ALTER TABLE users ADD COLUMN mfa_required INTEGER NOT NULL DEFAULT 0 CHECK (mfa_required IN (0, 1));
ALTER TABLE users ADD COLUMN mfa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (mfa_enabled IN (0, 1));
ALTER TABLE users ADD COLUMN mfa_secret_encrypted TEXT;
ALTER TABLE users ADD COLUMN mfa_enabled_at TEXT;

CREATE INDEX IF NOT EXISTS idx_users_mfa_required ON users(role, mfa_required, mfa_enabled);
