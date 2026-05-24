ALTER TABLE systems ADD COLUMN service_interval_months INTEGER NOT NULL DEFAULT 6 CHECK (service_interval_months BETWEEN 1 AND 36);
