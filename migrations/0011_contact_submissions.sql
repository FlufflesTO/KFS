CREATE TABLE IF NOT EXISTS contact_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  email TEXT NOT NULL CHECK (instr(email, '@') > 1),
  request_type TEXT NOT NULL CHECK (length(trim(request_type)) BETWEEN 2 AND 120),
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 3000),
  ip_hash TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted ON contact_submissions (submitted_at);
