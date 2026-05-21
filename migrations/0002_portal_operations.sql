ALTER TABLE users ADD COLUMN force_password_change INTEGER NOT NULL DEFAULT 0 CHECK (force_password_change IN (0, 1));
ALTER TABLE users ADD COLUMN password_changed_at TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IS NULL OR actor_role IN ('tech', 'admin', 'client', 'finance')),
  event_type TEXT NOT NULL CHECK (length(trim(event_type)) BETWEEN 3 AND 80),
  entity_type TEXT NOT NULL CHECK (length(trim(entity_type)) BETWEEN 2 AND 80),
  entity_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
  ip_hash TEXT,
  user_agent TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS portal_rate_limits (
  rate_key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created ON audit_events(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_type_created ON audit_events(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_window ON portal_rate_limits(scope, window_start);
