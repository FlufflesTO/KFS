-- Offline mutation idempotency ledger
-- Purpose: prevents duplicate writes during service-worker queue replay and stores recoverable draft payloads.

CREATE TABLE IF NOT EXISTS offline_mutations (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IS NULL OR actor_role IN ('tech', 'admin', 'client', 'finance')),
  mutation_type TEXT NOT NULL CHECK (mutation_type IN ('queued_request', 'jobcard_draft')),
  target_path TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  request_body_json TEXT,
  response_status INTEGER,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'applied', 'conflict', 'failed')),
  conflict_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_offline_mutations_actor_created ON offline_mutations(actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_offline_mutations_status_created ON offline_mutations(status, created_at);
CREATE INDEX IF NOT EXISTS idx_offline_mutations_target_created ON offline_mutations(target_path, created_at);

CREATE TRIGGER IF NOT EXISTS trg_offline_mutations_updated_at
AFTER UPDATE ON offline_mutations
FOR EACH ROW
BEGIN
  UPDATE offline_mutations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
