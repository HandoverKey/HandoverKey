import { getRedisClient } from "../config/redis";
import { logger } from "../config/logger";
import { UserRepository, getDatabaseClient } from "@handoverkey/database";

export interface FailedAttemptStatus {
  attemptCount: number;
}

/**
 * Per-account brute-force throttle.
 *
 * Historically this locked an account for 15 minutes after 5 failed logins.
 * That is a denial-of-service vector: anyone who knows a victim's email can
 * keep them permanently locked out (5 bad attempts every window) -- especially
 * dangerous for a dead-man's-switch product, where being unable to log in and
 * check in can trip the user's own inactivity handover.
 *
 * Instead we apply a PROGRESSIVE DELAY keyed by account: repeated failures make
 * each subsequent attempt slower (capped), which makes online guessing
 * impractical, but a correct password is NEVER blocked -- only briefly delayed.
 * Combined with the per-IP auth rate limiter and slow bcrypt hashing, this
 * defends against brute force without enabling account-lockout DoS.
 *
 * The DB `locked_until` / `failed_login_attempts` columns remain so that an
 * admin can still explicitly clear an account's throttle; the login path no
 * longer auto-populates them.
 */
export class AccountLockoutService {
  // Number of recent failures tolerated before delays kick in.
  private static readonly DELAY_THRESHOLD = 3;
  // Base delay once the threshold is exceeded (doubles per extra failure).
  private static readonly DELAY_BASE_MS = 1000;
  // Hard cap so a legitimate user under attack still gets in quickly.
  private static readonly DELAY_MAX_MS = 5000;
  // Sliding window over which failures are counted.
  private static readonly ATTEMPT_WINDOW = 15 * 60; // seconds

  private static getAttemptKey(userId: string): string {
    return `lockout:attempts:${userId}`;
  }

  /**
   * Records a failed login attempt (increments the sliding-window counter).
   * Never locks the account.
   */
  static async recordFailedAttempt(
    userId: string,
    ipAddress?: string,
  ): Promise<FailedAttemptStatus> {
    const redis = getRedisClient();
    const attemptKey = this.getAttemptKey(userId);

    try {
      const attempts = await redis.incr(attemptKey);

      // (Re)arm the window on every failure so a sustained attack keeps the
      // throttle warm, but a burst that stops naturally decays after the window.
      await redis.expire(attemptKey, this.ATTEMPT_WINDOW);

      logger.warn(
        { userId, attempts, ipAddress },
        "Failed login attempt recorded",
      );

      return { attemptCount: attempts };
    } catch (error) {
      // Never block login if Redis is unavailable.
      logger.error({ error, userId }, "Failed to record login attempt");
      return { attemptCount: 0 };
    }
  }

  /**
   * Current number of recent failed attempts for an account.
   */
  static async getAttemptCount(userId: string): Promise<number> {
    const redis = getRedisClient();
    try {
      const attempts = await redis.get(this.getAttemptKey(userId));
      return attempts ? parseInt(attempts, 10) : 0;
    } catch (error) {
      logger.error({ error, userId }, "Failed to get attempt count");
      return 0;
    }
  }

  /**
   * Computes how long the NEXT login attempt for this account should be delayed,
   * based on recent failures. Returns 0 while under the threshold, then an
   * exponentially increasing delay capped at DELAY_MAX_MS.
   */
  static async getThrottleDelayMs(userId: string): Promise<number> {
    const count = await this.getAttemptCount(userId);
    if (count < this.DELAY_THRESHOLD) {
      return 0;
    }
    const over = count - this.DELAY_THRESHOLD; // 0, 1, 2, ...
    const delay = this.DELAY_BASE_MS * 2 ** over;
    return Math.min(delay, this.DELAY_MAX_MS);
  }

  /**
   * Clears the throttle counter. Called on a successful login and whenever the
   * throttle should be reset. Only touches Redis -- the login path never writes
   * the DB lock fields, so there's nothing to clear there.
   */
  static async clearAttempts(userId: string): Promise<void> {
    const redis = getRedisClient();
    try {
      await redis.del(this.getAttemptKey(userId));
      logger.info({ userId }, "Failed login attempts cleared");
    } catch (error) {
      logger.error({ error, userId }, "Failed to clear login attempts");
    }
  }

  /**
   * Admin action: reset an account's throttle AND clear any legacy/admin-set
   * lock fields in the database.
   */
  static async unlockAccount(userId: string): Promise<void> {
    await this.clearAttempts(userId);

    try {
      const dbClient = getDatabaseClient();
      const userRepo = new UserRepository(dbClient.getKysely());
      await userRepo.update(userId, {
        failed_login_attempts: 0,
        locked_until: null,
      });
    } catch (error) {
      logger.error({ error, userId }, "Failed to clear DB lock fields");
      throw error;
    }

    logger.info({ userId }, "Account throttle reset by admin");
  }

  /**
   * Whether an account is explicitly locked. The login path no longer
   * auto-locks, so this reflects only an admin-set `locked_until` (retained for
   * the admin lockout-status endpoint).
   */
  static async isLocked(
    userId: string,
  ): Promise<{ isLocked: boolean; lockedUntil?: Date }> {
    try {
      const dbClient = getDatabaseClient();
      const userRepo = new UserRepository(dbClient.getKysely());
      const user = await userRepo.findById(userId);

      if (user?.locked_until && new Date(user.locked_until) > new Date()) {
        return { isLocked: true, lockedUntil: new Date(user.locked_until) };
      }
      return { isLocked: false };
    } catch (error) {
      logger.error({ error, userId }, "Failed to check lock status");
      return { isLocked: false };
    }
  }

  /**
   * Seconds until an admin-set lock expires, or null if not locked.
   */
  static async getTimeUntilUnlock(userId: string): Promise<number | null> {
    const status = await this.isLocked(userId);
    if (!status.isLocked || !status.lockedUntil) {
      return null;
    }
    return Math.max(
      0,
      Math.floor((status.lockedUntil.getTime() - Date.now()) / 1000),
    );
  }
}
