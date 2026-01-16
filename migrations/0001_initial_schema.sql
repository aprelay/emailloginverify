-- Email verification queue table
CREATE TABLE IF NOT EXISTS verification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('office365', 'gmail')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  result TEXT DEFAULT NULL CHECK(result IN ('valid', 'invalid', 'strong_bounce', 'error')),
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Verification results table
CREATE TABLE IF NOT EXISTS verification_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  provider TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('valid', 'invalid', 'strong_bounce')),
  details TEXT,
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API tokens for VPS worker authentication
CREATE TABLE IF NOT EXISTS api_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_queue_status ON verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_created ON verification_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_results_email ON verification_results(email);
CREATE INDEX IF NOT EXISTS idx_results_verified ON verification_results(verified_at);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON api_tokens(token);
