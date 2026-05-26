-- Project Sentinel - Finance / Sage Deep Integration
-- Purpose: Add caching fields for Sage IDs to prevent continuous API lookups
-- Dependencies: migrations
-- Structural Role: Schema migration

-- Add sage_contact_id to clients
ALTER TABLE clients ADD COLUMN sage_contact_id TEXT;

-- Add sage_document_id to finance_tasks 
-- (sage_document_ref is already there, but this holds the Sage GUID)
ALTER TABLE finance_tasks ADD COLUMN sage_document_id TEXT;
