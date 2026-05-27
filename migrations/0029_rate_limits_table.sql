-- Project Sentinel - Migrations
-- Purpose: Create rate_limits table and index for traffic control rate limiting
-- Dependencies: None
-- Structural Role: Database Migration

CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT NOT NULL,
  accessed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_accessed ON rate_limits(identifier, accessed_at);
