PRAGMA foreign_keys = ON;

ALTER TABLE jobs ADD COLUMN checklist_json TEXT;
ALTER TABLE jobs ADD COLUMN parts_json TEXT;
