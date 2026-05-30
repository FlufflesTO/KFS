-- Migration 0024_phase11_telemetry.sql
-- Purpose: Adds infrastructure for user feedback and A/B testing variants

CREATE TABLE IF NOT EXISTS user_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    variant TEXT, -- A or B
    page_path TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'ui', 'performance', 'bug', 'suggestion'
    message TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending', -- pending, reviewed, archived
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_submitted ON user_feedback(submitted_at);
