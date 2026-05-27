-- Project Sentinel - Migrations
-- Purpose: Add deleted_at column and index to sites table
-- Dependencies: None
-- Structural Role: Database Migration

ALTER TABLE sites ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_sites_deleted_at ON sites(deleted_at);
