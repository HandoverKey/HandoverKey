-- Track the last consumed TOTP time-step per user so a valid 6-digit code
-- cannot be replayed within its (~90s) validity window. A step is
-- floor(unixSeconds / 30); rejecting any step <= the stored value enforces
-- single-use TOTP codes.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_last_used_step INTEGER;
