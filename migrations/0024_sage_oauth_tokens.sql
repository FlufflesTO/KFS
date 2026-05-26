-- Project Sentinel - Finance / Sage Integration
-- Purpose: Create table for storing Sage OAuth credentials
-- Dependencies: migrations
-- Structural Role: Schema migration

CREATE TABLE IF NOT EXISTS sage_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL, -- Unix timestamp in seconds
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
