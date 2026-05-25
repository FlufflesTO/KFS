PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS job_visits (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  visit_date TEXT NOT NULL,
  arrival_time TEXT,
  departure_time TEXT,
  gps_latitude REAL,
  gps_longitude REAL,
  customer_name TEXT CHECK (customer_name IS NULL OR length(trim(customer_name)) BETWEEN 2 AND 160),
  customer_title TEXT CHECK (customer_title IS NULL OR length(trim(customer_title)) BETWEEN 2 AND 80),
  notes TEXT CHECK (notes IS NULL OR length(trim(notes)) BETWEEN 5 AND 3000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_job_visits_job ON job_visits(job_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_job_visits_tech ON job_visits(technician_id, visit_date);

CREATE TRIGGER IF NOT EXISTS trg_job_visits_updated_at
AFTER UPDATE ON job_visits
FOR EACH ROW
BEGIN
  UPDATE job_visits SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
