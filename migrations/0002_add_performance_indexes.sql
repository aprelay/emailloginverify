-- Add indexes for better query performance with 10k+ records

-- Index on id (descending) for ORDER BY id DESC queries
CREATE INDEX IF NOT EXISTS idx_verification_queue_id_desc ON verification_queue(id DESC);

-- Index on status for filtering pending/processing jobs
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON verification_queue(status);

-- Index on result for filtering valid/bounce results
CREATE INDEX IF NOT EXISTS idx_verification_queue_result ON verification_queue(result);

-- Composite index for worker queries (status + created_at)
CREATE INDEX IF NOT EXISTS idx_verification_queue_status_created ON verification_queue(status, created_at);

-- Index on email for duplicate checking
CREATE INDEX IF NOT EXISTS idx_verification_queue_email ON verification_queue(email);
