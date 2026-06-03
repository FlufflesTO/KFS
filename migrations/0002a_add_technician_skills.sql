-- Migration: 0002_add_technician_skills.sql
-- Purpose: Adds many-to-many SAQCC credential mapping to enable intelligent dispatch load balancing

CREATE TABLE IF NOT EXISTS saqcc_certifications (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS technician_credentials (
  technician_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saqcc_code TEXT NOT NULL REFERENCES saqcc_certifications(code) ON DELETE CASCADE,
  issued_date TEXT,
  expiry_date TEXT,
  PRIMARY KEY (technician_id, saqcc_code)
);

-- Seed basic SAQCC codes
INSERT OR IGNORE INTO saqcc_certifications (code, name, description) VALUES
  ('SANS1475', 'Fire Extinguishers', 'Maintenance of portable fire extinguishers'),
  ('SANS10139', 'Fire Detection', 'Design, installation, and maintenance of fire detection and alarm systems'),
  ('SANS14520', 'Gas Suppression', 'Installation and maintenance of gaseous fire-extinguishing systems');
