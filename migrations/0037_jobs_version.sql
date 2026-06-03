-- Migration 0037: Optimistic concurrency column for jobs
-- The jobcard submission flow uses an optimistic-locking version on jobs:
-- the technician loads jobs.version, submits expectedVersion, and the API
-- performs a conditional UPDATE (... WHERE id = ? AND version = ?) plus a
-- pre-check that returns HTTP 409 if the server version has advanced.
-- Without this column those reads/writes fail with "no such column: version".

ALTER TABLE jobs ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
