-- Waitlist signups (previously only created by the orphaned Kysely migration
-- 002_create_waitlist_table, so it never existed in production via migrate:prod).
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  tier_interest VARCHAR(50),
  source VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
