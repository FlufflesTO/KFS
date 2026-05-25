-- Phase 22: Technician Field Enhancements
-- Add GPS location, customer name display, and unable-to-complete workflow

ALTER TABLE jobs 
ADD COLUMN customer_site_contact TEXT;

ALTER TABLE jobs 
ADD COLUMN customer_site_phone TEXT;

ALTER TABLE jobs 
ADD COLUMN gps_latitude REAL;

ALTER TABLE jobs 
ADD COLUMN gps_longitude REAL;

ALTER TABLE jobs 
ADD COLUMN gps_captured_at TEXT;

ALTER TABLE jobs 
ADD COLUMN unable_to_complete INTEGER NOT NULL DEFAULT 0 CHECK (unable_to_complete IN (0, 1));

ALTER TABLE jobs 
ADD COLUMN unable_to_complete_reason TEXT;

ALTER TABLE jobs 
ADD COLUMN unable_to_complete_category TEXT CHECK (unable_to_complete_category IS NULL OR unable_to_complete_category IN ('Access Denied', 'Equipment Not Available', 'Site Unsafe', 'Customer Request', 'Weather Conditions', 'Other'));

ALTER TABLE jobs 
ADD COLUMN reschedule_required INTEGER NOT NULL DEFAULT 0 CHECK (reschedule_required IN (0, 1));

-- Update trigger to include new fields
DROP TRIGGER IF EXISTS trg_jobs_updated_at;
CREATE TRIGGER trg_jobs_updated_at
AFTER UPDATE ON jobs
FOR EACH ROW
BEGIN
  UPDATE jobs SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;

-- Index for GPS-enabled jobs
CREATE INDEX IF NOT EXISTS idx_jobs_gps_location ON jobs(gps_latitude, gps_longitude) WHERE gps_latitude IS NOT NULL AND gps_longitude IS NOT NULL;

-- Index for unable-to-complete tracking
CREATE INDEX IF NOT EXISTS idx_jobs_unable_to_complete ON jobs(unable_to_complete, reschedule_required, status) WHERE unable_to_complete = 1;

COMMENT: This migration adds technician field operation enhancements.
- customer_site_contact: On-site contact person name for the job
- customer_site_phone: Contact phone number for site access
- gps_latitude/longitude: Location where job was performed
- gps_captured_at: Timestamp of GPS capture
- unable_to_complete: Flag for jobs that couldn't be completed
- unable_to_complete_reason: Detailed explanation
- unable_to_complete_category: Categorized reason for reporting
- reschedule_required: Flag indicating if job needs rescheduling
