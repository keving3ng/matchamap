-- Add fraud detection columns to waitlist table
ALTER TABLE waitlist ADD COLUMN is_flagged_fraud INTEGER DEFAULT 0;
ALTER TABLE waitlist ADD COLUMN fraud_score REAL DEFAULT 0.0;
ALTER TABLE waitlist ADD COLUMN fraud_reason TEXT;
ALTER TABLE waitlist ADD COLUMN signup_ip TEXT;

-- Create index for fraud detection queries
CREATE INDEX waitlist_fraud_idx ON waitlist(is_flagged_fraud);