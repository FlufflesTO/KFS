PRAGMA foreign_keys = ON;

ALTER TABLE jobs ADD COLUMN deleted_at TEXT;
ALTER TABLE defects ADD COLUMN deleted_at TEXT;
ALTER TABLE certificates ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON jobs(deleted_at);
CREATE INDEX IF NOT EXISTS idx_defects_deleted_at ON defects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_certificates_deleted_at ON certificates(deleted_at);

CREATE TRIGGER IF NOT EXISTS trg_financial_records_vat_check_insert
BEFORE INSERT ON financial_records
FOR EACH ROW
WHEN NEW.sage_amount_ex_vat IS NOT NULL
 AND NEW.sage_vat_amount IS NOT NULL
 AND NEW.sage_amount_inc_vat IS NOT NULL
 AND NEW.sage_amount_ex_vat + NEW.sage_vat_amount <> NEW.sage_amount_inc_vat
BEGIN
  SELECT RAISE(ABORT, 'sage_amount_ex_vat + sage_vat_amount must equal sage_amount_inc_vat');
END;

CREATE TRIGGER IF NOT EXISTS trg_financial_records_vat_check_update
BEFORE UPDATE OF sage_amount_ex_vat, sage_vat_amount, sage_amount_inc_vat ON financial_records
FOR EACH ROW
WHEN NEW.sage_amount_ex_vat IS NOT NULL
 AND NEW.sage_vat_amount IS NOT NULL
 AND NEW.sage_amount_inc_vat IS NOT NULL
 AND NEW.sage_amount_ex_vat + NEW.sage_vat_amount <> NEW.sage_amount_inc_vat
BEGIN
  SELECT RAISE(ABORT, 'sage_amount_ex_vat + sage_vat_amount must equal sage_amount_inc_vat');
END;

CREATE TRIGGER IF NOT EXISTS trg_job_visits_gps_check_insert
BEFORE INSERT ON job_visits
FOR EACH ROW
WHEN (NEW.gps_latitude IS NOT NULL AND (NEW.gps_latitude < -90 OR NEW.gps_latitude > 90))
  OR (NEW.gps_longitude IS NOT NULL AND (NEW.gps_longitude < -180 OR NEW.gps_longitude > 180))
BEGIN
  SELECT RAISE(ABORT, 'GPS coordinates out of range');
END;

CREATE TRIGGER IF NOT EXISTS trg_job_visits_gps_check_update
BEFORE UPDATE OF gps_latitude, gps_longitude ON job_visits
FOR EACH ROW
WHEN (NEW.gps_latitude IS NOT NULL AND (NEW.gps_latitude < -90 OR NEW.gps_latitude > 90))
  OR (NEW.gps_longitude IS NOT NULL AND (NEW.gps_longitude < -180 OR NEW.gps_longitude > 180))
BEGIN
  SELECT RAISE(ABORT, 'GPS coordinates out of range');
END;
